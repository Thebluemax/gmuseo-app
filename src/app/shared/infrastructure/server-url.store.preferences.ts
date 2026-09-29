import { inject, Injectable, InjectionToken } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { ServerUrlStore } from '../domain/server-url.store';

const KEY = 'gm_api_url';

/** The three plugin calls this store makes. */
export type PreferencesPlugin = Pick<typeof Preferences, 'get' | 'set' | 'remove'>;

/**
 * The Capacitor plugin behind a token, so the store can be exercised
 * off-device: the plugin object is a proxy that cannot be spied on.
 */
export const PREFERENCES_PLUGIN = new InjectionToken<PreferencesPlugin>('PREFERENCES_PLUGIN', {
  providedIn: 'root',
  factory: () => Preferences,
});

/**
 * Capacitor Preferences on every platform: SharedPreferences on Android,
 * UserDefaults on iOS, localStorage in the browser. One implementation is
 * enough because the plugin ships its own web fallback and the value is not a
 * secret.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesServerUrlStore extends ServerUrlStore {
  private plugin = inject(PREFERENCES_PLUGIN);

  async get(): Promise<string | null> {
    const { value } = await this.plugin.get({ key: KEY });
    return value || null;
  }

  async set(url: string): Promise<void> {
    await this.plugin.set({ key: KEY, value: url });
  }

  async clear(): Promise<void> {
    await this.plugin.remove({ key: KEY });
  }
}
