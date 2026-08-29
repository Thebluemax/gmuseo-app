import { Injectable } from '@angular/core';
import { SecureTokenStorage } from '../domain/token-storage';

/**
 * Web fallback — in-memory only. The browser has no OS-grade secure store, and
 * localStorage/sessionStorage are XSS-readable (and banned by design). Tokens
 * therefore live only for the lifetime of the page; a refresh forces re-login.
 *
 * The primary distribution is the native bundle, where real Keychain/Keystore
 * backing exists (see SecureTokenStorageNative).
 */
@Injectable()
export class SecureTokenStorageWeb extends SecureTokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async getAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  async getRefreshToken(): Promise<string | null> {
    return this.refreshToken;
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  async clear(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
  }
}
