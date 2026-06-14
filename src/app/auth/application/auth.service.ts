import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthRepository } from '../domain/auth.repository';
import { AuthUser, LoginCredentials, RegisterCredentials } from '../domain/auth.model';
import { SecureTokenStorage } from '../domain/token-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private repo = inject(AuthRepository);
  private storage = inject(SecureTokenStorage);
  private router = inject(Router);

  // In-memory runtime copies. The interceptor reads `_accessToken` synchronously
  // on every request (no async storage hit in the hot path). Source of truth at
  // rest is the secure storage; these signals are hydrated from it on bootstrap.
  private _accessToken = signal<string | null>(null);
  private _refreshToken = signal<string | null>(null);
  private _user = signal<AuthUser | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);
  /** @deprecated transitional alias — migrate callers to `isAuthenticated`. */
  readonly isLoggedIn = this.isAuthenticated;

  /** Synchronous read for the interceptor. */
  accessToken(): string | null {
    return this._accessToken();
  }

  /**
   * Read the secure storage into the in-memory signals. Run from
   * provideAppInitializer so guards see a correct `isAuthenticated` before any
   * route resolves.
   */
  async hydrate(): Promise<void> {
    const [access, refresh] = await Promise.all([
      this.storage.getAccessToken(),
      this.storage.getRefreshToken(),
    ]);
    this._accessToken.set(access);
    this._refreshToken.set(refresh);
  }

  async login(credentials: LoginCredentials): Promise<void> {
    // 422 (bad credentials) rejects → surfaced to the caller (login page).
    const res = await this.repo.login(credentials);
    await this.persist(res.access_token, res.refresh_token);
  }

  /**
   * Register then immediately log in with the same credentials — the register
   * endpoint returns no tokens. A 422 from either call rejects with the
   * per-field validation errors for the page to display.
   */
  async register(credentials: RegisterCredentials): Promise<void> {
    const user = await this.repo.register(credentials);
    this._user.set(user);
    await this.login({ email: credentials.email, password: credentials.password });
  }

  async logout(): Promise<void> {
    try {
      await this.repo.logout();
    } catch {
      // best-effort: revoke server-side, but always clear locally below
    } finally {
      await this.forceLogout();
    }
  }

  // --- refresh: single-flight -------------------------------------------------

  private refreshInFlight: Promise<string | null> | null = null;

  /**
   * Returns a fresh access token, or null if refresh failed (in which case the
   * session has already been torn down). All concurrent 401s share ONE in-flight
   * refresh promise, so the rotating refresh token is spent exactly once.
   */
  refresh(): Promise<string | null> {
    this.refreshInFlight ??= this.doRefresh().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async doRefresh(): Promise<string | null> {
    const refreshToken = this._refreshToken();
    if (!refreshToken) {
      await this.forceLogout();
      return null;
    }
    try {
      const res = await this.repo.refresh(refreshToken);
      await this.persist(res.access_token, res.refresh_token);
      return res.access_token;
    } catch {
      // Refresh itself rejected (expired / revoked / rotated away) → full logout.
      await this.forceLogout();
      return null;
    }
  }

  // --- internals --------------------------------------------------------------

  private async persist(access: string, refresh: string): Promise<void> {
    this._accessToken.set(access);
    this._refreshToken.set(refresh);
    await this.storage.setTokens(access, refresh);
  }

  /** Clear all auth state (memory + secure storage) and route to login. */
  async forceLogout(): Promise<void> {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    await this.storage.clear();
    await this.router.navigate(['/auth/login']);
  }
}
