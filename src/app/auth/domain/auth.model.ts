export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * POST /auth/register body. `lastname` optional; `password_confirmation` must
 * match `password` (server-validated, min 8). `username` 3–30 [A-Za-z0-9_-].
 */
export interface RegisterCredentials {
  name: string;
  lastname?: string;
  email: string;
  username: string;
  password: string;
  password_confirmation: string;
}

/**
 * No user payload comes from login/refresh (tokens only). This is the shape of
 * the registered account (register 201 → unwrapped from its `data` envelope).
 * `name` arrives concatenated (name + lastname); `role` defaults to 'app-user'.
 */
export interface AuthUser {
  id: string; // UUID
  name: string;
  email: string;
  username?: string;
  role?: string;
}

/**
 * Laravel JsonResource wrap. Every success payload (login, refresh, register)
 * is under `data`. Only logout differs — plain `{ message }`, no payload.
 */
export interface Wrapped<T> {
  data: T;
}

/**
 * Inner payload of POST /auth/login and POST /auth/refresh (both under `data`).
 *   access_token  — 15 min life; Bearer on every authed request.
 *   refresh_token — 30 day life; ONLY for /auth/refresh (403 elsewhere). Rotated:
 *                   the sent refresh token is revoked, always keep the new one.
 *   expires_in    — access-token lifetime in seconds (e.g. 900).
 */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export type AuthResponse = AuthTokens;
export type RefreshResponse = AuthTokens;

/** Shape of a 422 validation error (login bad-creds, register field errors). */
export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}
