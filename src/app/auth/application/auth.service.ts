import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthRepository } from '../domain/auth.repository';
import { AuthUser, LoginCredentials } from '../domain/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private repo = inject(AuthRepository);

  private _token = signal<string | null>(localStorage.getItem('gm_token'));
  private _user = signal<AuthUser | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);

  async login(credentials: LoginCredentials): Promise<void> {
    const response = await this.repo.login(credentials);
    if (response.token) {
      this._token.set(response.token);
      localStorage.setItem('gm_token', response.token);
    }
    if (response.user) {
      this._user.set(response.user);
    }
  }

  async logout(): Promise<void> {
    await this.repo.logout();
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem('gm_token');
  }
}
