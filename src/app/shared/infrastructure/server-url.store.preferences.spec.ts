import { TestBed } from '@angular/core/testing';

import {
  PREFERENCES_PLUGIN, PreferencesPlugin, PreferencesServerUrlStore,
} from './server-url.store.preferences';

/** Stands in for the Capacitor plugin: a map, like SharedPreferences. */
class FakePlugin implements PreferencesPlugin {
  values = new Map<string, string>();

  async get({ key }: { key: string }): Promise<{ value: string | null }> {
    return { value: this.values.get(key) ?? null };
  }
  async set({ key, value }: { key: string; value: string }): Promise<void> {
    this.values.set(key, value);
  }
  async remove({ key }: { key: string }): Promise<void> {
    this.values.delete(key);
  }
}

describe('PreferencesServerUrlStore', () => {
  let store: PreferencesServerUrlStore;
  let plugin: FakePlugin;

  beforeEach(() => {
    plugin = new FakePlugin();
    TestBed.configureTestingModule({
      providers: [{ provide: PREFERENCES_PLUGIN, useValue: plugin }],
    });
    store = TestBed.inject(PreferencesServerUrlStore);
  });

  it('answers null when nothing was saved', async () => {
    expect(await store.get()).toBeNull();
  });

  it('round-trips a URL', async () => {
    await store.set('http://192.168.0.154/api');

    expect(await store.get()).toBe('http://192.168.0.154/api');
  });

  it('treats an empty value as nothing saved', async () => {
    plugin.values.set('gm_api_url', '');

    expect(await store.get()).toBeNull();
  });

  it('forgets the URL on clear', async () => {
    await store.set('http://192.168.0.154/api');
    await store.clear();

    expect(await store.get()).toBeNull();
    expect(plugin.values.size).toBe(0);
  });
});
