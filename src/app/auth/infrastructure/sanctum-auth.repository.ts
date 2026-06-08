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

  login(credentials: LoginCredentials): Promise<AuthResponse> {
    return firstValueFrom(
      this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
    );
  }

  logout(): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/auth/logout`, {})
    );
  }
}
