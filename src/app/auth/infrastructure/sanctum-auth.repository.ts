import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthRepository } from '../domain/auth.repository';
import {
  AuthResponse,
  AuthUser,
  LoginCredentials,
  RefreshResponse,
  RegisterCredentials,
  Wrapped,
} from '../domain/auth.model';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';
import { skipAuth } from './auth.http-context';

// Confirmed routes (Laravel /api/v1). `Accept: application/json` is forced
// globally by authInterceptor — without it the API 302-redirects instead of
// returning JSON.
const LOGIN_PATH = '/v1/auth/login';
const LOGOUT_PATH = '/v1/auth/logout';
const REFRESH_PATH = '/v1/auth/refresh';
const REGISTER_PATH = '/v1/auth/register';

@Injectable()
export class SanctumAuthRepository extends AuthRepository {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await firstValueFrom(
      this.http.post<Wrapped<AuthResponse>>(`${this.baseUrl}${LOGIN_PATH}`, credentials, {
        context: skipAuth(),
      })
    );
    return res.data;
  }

  logout(): Promise<void> {
    // Bearer (access token) attached by the interceptor; skipAuth so a 401 here
    // does not trigger a refresh attempt.
    return firstValueFrom(
      this.http.post<void>(`${this.baseUrl}${LOGOUT_PATH}`, {}, { context: skipAuth() })
    );
  }

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    // Refresh is authorized with the REFRESH token (using it anywhere else →
    // 403). Header set explicitly; skipAuth bypasses the access-token logic.
    const res = await firstValueFrom(
      this.http.post<Wrapped<RefreshResponse>>(
        `${this.baseUrl}${REFRESH_PATH}`,
        {},
        { context: skipAuth(), headers: { Authorization: `Bearer ${refreshToken}` } }
      )
    );
    return res.data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    // 201, no tokens. Unlike login/refresh, the resource is JsonResource-wrapped
    // in `data`.
    const res = await firstValueFrom(
      this.http.post<Wrapped<AuthUser>>(`${this.baseUrl}${REGISTER_PATH}`, credentials, {
        context: skipAuth(),
      })
    );
    return res.data;
  }
}
