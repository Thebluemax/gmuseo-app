import { computed, inject, Injectable, Provider, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ServerUrlStore } from '../domain/server-url.store';
import { API_BASE_URL } from '../infrastructure/api.config';

/**
 * Which API the app talks to.
 *
 * The build carries a default (`environment.apiUrl`); the device may override
 * it with a URL persisted in `ServerUrlStore`. Everything that needs the base
 * URL reads `API_BASE_URL`, which is provided from here, so the interceptor
 * and every repository agree on one value — the resolved one, not the build's.
 */
@Injectable({ providedIn: 'root' })
export class ServerConfig {
  private store = inject(ServerUrlStore);

  readonly defaultApiUrl = environment.apiUrl;

  private _apiUrl = signal(this.defaultApiUrl);
  readonly apiUrl = this._apiUrl.asReadonly();
  readonly isDefault = computed(() => this._apiUrl() === this.defaultApiUrl);

  /**
   * Resolve the URL from the store, falling back to the build's. Must finish
   * before anything injects `API_BASE_URL`: the token is read once per
   * consumer, so a consumer built earlier would keep the default for good.
   */
  async load(): Promise<void> {
    let saved: string | null = null;
    try {
      saved = await this.store.get();
    } catch {
      // An unreadable preference is the same as none: the build's default.
    }
    this._apiUrl.set(saved ?? this.defaultApiUrl);
  }

  /**
   * Remember `url` as the server. Choosing the build's default again drops the
   * entry instead of pinning it, so a later release that moves the default is
   * followed.
   */
  async save(url: string): Promise<void> {
    if (url === this.defaultApiUrl) {
      await this.store.clear();
    } else {
      await this.store.set(url);
    }
    this._apiUrl.set(url);
  }

  /**
   * Start the app again on the saved server. Every consumer of `API_BASE_URL`
   * captured the previous value when it was built; reloading the document is
   * the one way to rebuild them all with the new one, and it also guarantees
   * nothing built against the old server survives the switch.
   */
  restart(): void {
    window.location.reload();
  }
}

/** `API_BASE_URL` as resolved by `ServerConfig` — not `environment.apiUrl`. */
export function provideApiBaseUrl(): Provider {
  return { provide: API_BASE_URL, useFactory: () => inject(ServerConfig).apiUrl() };
}
