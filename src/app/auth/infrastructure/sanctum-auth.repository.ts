import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthRepository } from '../domain/auth.repository';
import { AuthResponse, LoginCredentials } from '../domain/auth.model';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';

@Injectable()
export class SanctumAuthRepository extends AuthRepository {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  private get rootUrl(): string {
    return this.baseUrl.replace('/api', '');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await firstValueFrom(
      this.http.get(`${this.rootUrl}/sanctum/csrf-cookie`, { withCredentials: true })
    );
    return firstValueFrom(
      this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials, {
        withCredentials: true,
      })
    );
  }

  async logout(): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true })
    );
  }
}
