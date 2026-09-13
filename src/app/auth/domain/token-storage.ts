/**
 * Secure persistence for the auth token pair.
 *
 * Native: backed by iOS Keychain / Android Keystore (EncryptedSharedPreferences).
 * Web: in-memory only — no localStorage/sessionStorage (XSS-readable). The PWA
 * therefore re-authenticates on every page refresh; this is intentional.
 *
 * All operations are async because the native backends are async.
 */
export abstract class SecureTokenStorage {
  abstract getAccessToken(): Promise<string | null>;
  abstract getRefreshToken(): Promise<string | null>;
  abstract setTokens(accessToken: string, refreshToken: string): Promise<void>;
  abstract clear(): Promise<void>;
}
