import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { environment } from 'src/environments/environment';
import { provideApiBaseUrl, ServerConfig } from './server-config';
import { ServerUrlStore } from '../domain/server-url.store';
import { API_BASE_URL } from '../infrastructure/api.config';
import { authInterceptor } from '../../auth/infrastructure/auth.interceptor';
import { AuthRepository } from '../../auth/domain/auth.repository';
import { SanctumAuthRepository } from '../../auth/infrastructure/sanctum-auth.repository';
import { SecureTokenStorage } from '../../auth/domain/token-storage';
import { SecureTokenStorageWeb } from '../../auth/infrastructure/secure-token.storage.web';
import { CategoryRepository } from '../../catalog/domain/category.repository';
import { HttpCategoryRepository } from '../../catalog/infrastructure/http-category.repository';
import { GraffitiRepository } from '../../graffiti/domain/repositories/graffiti.repository';
import { HttpGraffitiRepository } from '../../graffiti/infrastructure/repositories/http-graffiti.repository';

const SAVED = 'http://192.168.0.154/api';

/** In-memory stand-in for Capacitor Preferences. */
class StubStore extends ServerUrlStore {
  url: string | null = null;
  async get(): Promise<string | null> {
    return this.url;
  }
  async set(url: string): Promise<void> {
    this.url = url;
  }
  async clear(): Promise<void> {
    this.url = null;
  }
}

describe('ServerConfig', () => {
  let store: StubStore;
  let config: ServerConfig;

  beforeEach(() => {
    store = new StubStore();
    TestBed.configureTestingModule({
      providers: [
        { provide: ServerUrlStore, useValue: store },
        provideApiBaseUrl(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthRepository, useClass: SanctumAuthRepository },
        { provide: SecureTokenStorage, useClass: SecureTokenStorageWeb },
        { provide: CategoryRepository, useClass: HttpCategoryRepository },
        { provide: GraffitiRepository, useClass: HttpGraffitiRepository },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    });
    config = TestBed.inject(ServerConfig);
  });

  it('uses the build default when the device has no saved server', async () => {
    await config.load();

    expect(config.apiUrl()).toBe(environment.apiUrl);
    expect(config.isDefault()).toBeTrue();
    expect(TestBed.inject(API_BASE_URL)).toBe(environment.apiUrl);
  });

  it('uses the saved server when the device has one', async () => {
    store.url = SAVED;

    await config.load();

    expect(config.apiUrl()).toBe(SAVED);
    expect(config.isDefault()).toBeFalse();
    expect(TestBed.inject(API_BASE_URL)).toBe(SAVED);
  });

  it('falls back to the build default when the store cannot be read', async () => {
    spyOn(store, 'get').and.rejectWith(new Error('plugin missing'));

    await config.load();

    expect(config.apiUrl()).toBe(environment.apiUrl);
  });

  /**
   * The point of providing the token from here: a repository builds its
   * request on the same base the interceptor recognises as "the API", so the
   * saved server gets `Accept: application/json` and the bearer like any other.
   */
  it('gives the interceptor and the repositories the same URL', async () => {
    store.url = SAVED;
    await config.load();
    const http = TestBed.inject(HttpTestingController);

    const pending = TestBed.inject(CategoryRepository).getList();
    const req = http.expectOne((r) => r.url === `${SAVED}/v1/categories`);
    expect(req.request.headers.get('Accept')).toBe('application/json');
    req.flush([]);
    await pending;

    // A request built on the build default would go past the interceptor.
    TestBed.inject(HttpClient).get(`${environment.apiUrl}/v1/categories`).subscribe();
    const stray = http.expectOne(`${environment.apiUrl}/v1/categories`);
    expect(stray.request.headers.has('Accept')).toBeFalse();
    stray.flush([]);
    http.verify();
  });

  describe('save', () => {
    it('persists a server that is not the build default', async () => {
      await config.save(SAVED);

      expect(store.url).toBe(SAVED);
      expect(config.apiUrl()).toBe(SAVED);
    });

    it('drops the entry when the build default is chosen again', async () => {
      store.url = SAVED;
      await config.load();

      await config.save(environment.apiUrl);

      expect(store.url).toBeNull();
      expect(config.isDefault()).toBeTrue();
    });
  });
});
