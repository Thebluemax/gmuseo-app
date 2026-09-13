import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthRepository } from '../domain/auth.repository';
import { AuthUser, LoginCredentials, RegisterCredentials } from '../domain/auth.model';
import { SecureTokenStorage } from '../domain/token-storage';

/**
 * Thrown by an attempt handed to `AuthService.withSessionRetry` when the
 * server rejected the session (401). `cause` is what the caller gets if the
 * session cannot be renewed.
 */
export class SessionRejectedError extends Error {
  constructor(override readonly cause: unknown) {
    super('The server rejected the session.');
    this.name = 'SessionRejectedError';
  }
}

/** One authenticated attempt: the access token to present, or null when there is none. */
export type SessionAttempt<T> = (accessToken: string | null) => Promise<T>;

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

  // --- renew-and-retry -----------------------------------------------------------

  /**
   * The session contract of `identity/renovacion-de-sesion`, once, for every
   * transport: run the attempt with the current token; if it reports the
   * session rejected, renew once and run it again with the new token; if that
   * is rejected too, or the renewal fails, the session is torn down and the
   * original failure reaches the caller. The interceptor and the raw upload
   * both go through here so neither can drift from the other again.
   */
  async withSessionRetry<T>(attempt: SessionAttempt<T>): Promise<T> {
    try {
      return await attempt(this.accessToken());
    } catch (err) {
      if (!(err instanceof SessionRejectedError)) throw err;
      const renewed = await this.refresh();
      // Refresh failed: forceLogout already ran inside it.
      if (!renewed) throw err.cause;
      try {
        return await attempt(renewed);
      } catch (again) {
        if (!(again instanceof SessionRejectedError)) throw again;
        // A token the server just issued and rejects anyway: nothing left to renew.
        await this.forceLogout();
        throw again.cause;
      }
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
