import { Injectable } from '@angular/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { SecureTokenStorage } from '../domain/token-storage';

const ACCESS_KEY = 'gm_access_token';
const REFRESH_KEY = 'gm_refresh_token';

/**
 * Native secure storage — iOS Keychain / Android Keystore via
 * `@aparajita/capacitor-secure-storage`. Values at rest are not reachable
 * from JavaScript, so an XSS payload in the WebView cannot read the tokens.
 */
@Injectable()
export class SecureTokenStorageNative extends SecureTokenStorage {
  async getAccessToken(): Promise<string | null> {
    return (await SecureStorage.get(ACCESS_KEY)) as string | null;
  }

  async getRefreshToken(): Promise<string | null> {
    return (await SecureStorage.get(REFRESH_KEY)) as string | null;
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStorage.set(ACCESS_KEY, accessToken);
    await SecureStorage.set(REFRESH_KEY, refreshToken);
  }

  async clear(): Promise<void> {
    await SecureStorage.remove(ACCESS_KEY);
    await SecureStorage.remove(REFRESH_KEY);
  }
}
