import { AuthResponse, LoginCredentials } from './auth.model';

export abstract class AuthRepository {
  abstract login(credentials: LoginCredentials): Promise<AuthResponse>;
  abstract logout(): Promise<void>;
}
