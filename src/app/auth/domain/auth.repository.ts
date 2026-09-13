import {
  AuthResponse,
  AuthUser,
  LoginCredentials,
  RefreshResponse,
  RegisterCredentials,
} from './auth.model';

export abstract class AuthRepository {
  abstract login(credentials: LoginCredentials): Promise<AuthResponse>;
  abstract logout(): Promise<void>;
  /** Exchanges a refresh token for a rotated access+refresh pair. */
  abstract refresh(refreshToken: string): Promise<RefreshResponse>;
  /** Creates an account (no tokens returned). Caller logs in afterwards. */
  abstract register(credentials: RegisterCredentials): Promise<AuthUser>;
}
