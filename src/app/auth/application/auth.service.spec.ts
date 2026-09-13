import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { AuthRepository } from '../domain/auth.repository';
import { SecureTokenStorage } from '../domain/token-storage';
import { SanctumAuthRepository } from '../infrastructure/sanctum-auth.repository';
import { authInterceptor } from '../infrastructure/auth.interceptor';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';

const BASE_URL = '/api';
const ACCESS = '1|access-token-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const REFRESH = '2|refresh-token-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const NEW_ACCESS = '3|rotated-access-cccccccccccccccccccccccccccc';
const NEW_REFRESH = '4|rotated-refresh-dddddddddddddddddddddddddd';

/** In-memory stand-in for the OS keystore. */
class StubTokenStorage extends SecureTokenStorage {
  access: string | null = null;
  refresh: string | null = null;
  clearCount = 0;

  async getAccessToken(): Promise<string | null> {
    return this.access;
  }
  async getRefreshToken(): Promise<string | null> {
    return this.refresh;
  }
  async setTokens(access: string, refresh: string): Promise<void> {
    this.access = access;
    this.refresh = refresh;
  }
  async clear(): Promise<void> {
    this.access = null;
    this.refresh = null;
    this.clearCount++;
  }
}

const pair = (access: string, refresh: string) => ({
  data: { access_token: access, refresh_token: refresh, token_type: 'Bearer', expires_in: 900 },
});

/** The refresh path crosses several promise hops before settling. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('AuthService', () => {
  let auth: AuthService;
  let httpMock: HttpTestingController;
  let storage: StubTokenStorage;
  let router: { navigate: jasmine.Spy };

  beforeEach(() => {
    router = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        { provide: SecureTokenStorage, useClass: StubTokenStorage },
        { provide: AuthRepository, useClass: SanctumAuthRepository },
        { provide: Router, useValue: router },
      ],
    });

    auth = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(SecureTokenStorage) as StubTokenStorage;
  });

  afterEach(() => httpMock.verify());

  async function withSession(): Promise<void> {
    storage.access = ACCESS;
    storage.refresh = REFRESH;
    await auth.hydrate();
  }

  describe('hydrate', () => {
    it('reports an authenticated session when the store holds one', async () => {
      await withSession();
      expect(auth.isAuthenticated()).toBeTrue();
    });

    it('reports no session when the store is empty', async () => {
      await auth.hydrate();
      expect(auth.isAuthenticated()).toBeFalse();
      expect(auth.accessToken()).toBeNull();
    });
  });

  describe('refresh', () => {
    it('stores the rotated pair, not the one it sent', async () => {
      await withSession();

      const token = auth.refresh();
      const req = httpMock.expectOne(`${BASE_URL}/v1/auth/refresh`);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${REFRESH}`);
      req.flush(pair(NEW_ACCESS, NEW_REFRESH));

      expect(await token).toBe(NEW_ACCESS);
      // Keeping the old refresh token is what kills the session on the next
      // renewal, and it looks identical to success until then.
      expect(await storage.getRefreshToken()).toBe(NEW_REFRESH);
      expect(await storage.getAccessToken()).toBe(NEW_ACCESS);
    });

    it('spends one refresh token for concurrent callers', async () => {
      await withSession();

      const all = Promise.all([auth.refresh(), auth.refresh(), auth.refresh()]);

      // Rotation is why this matters: a second in-flight refresh would present a
      // token the first one just revoked, and log out a valid session.
      const reqs = httpMock.match(`${BASE_URL}/v1/auth/refresh`);
      expect(reqs.length).toBe(1);
      reqs[0].flush(pair(NEW_ACCESS, NEW_REFRESH));

      expect(await all).toEqual([NEW_ACCESS, NEW_ACCESS, NEW_ACCESS]);
    });

    it('allows a later refresh once the shared one has settled', async () => {
      await withSession();

      const first = auth.refresh();
      httpMock.expectOne(`${BASE_URL}/v1/auth/refresh`).flush(pair(NEW_ACCESS, NEW_REFRESH));
      await first;

      const second = auth.refresh();
      const req = httpMock.expectOne(`${BASE_URL}/v1/auth/refresh`);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${NEW_REFRESH}`);
      req.flush(pair('5|third-access', '6|third-refresh'));
      expect(await second).toBe('5|third-access');
    });

    it('is not left blocked after a failed refresh', async () => {
      await withSession();

      const first = auth.refresh();
      httpMock
        .expectOne(`${BASE_URL}/v1/auth/refresh`)
        .flush({ message: 'Unauthenticated.' }, { status: 401, statusText: 'Unauthorized' });
      expect(await first).toBeNull();

      // The session is gone, so a later refresh must not call the endpoint —
      // but it must not hang on the previous promise either.
      await withSession();
      const second = auth.refresh();
      httpMock.expectOne(`${BASE_URL}/v1/auth/refresh`).flush(pair(NEW_ACCESS, NEW_REFRESH));
      expect(await second).toBe(NEW_ACCESS);
    });

    it('tears the session down when the refresh is rejected', async () => {
      await withSession();

      const token = auth.refresh();
      httpMock
        .expectOne(`${BASE_URL}/v1/auth/refresh`)
        .flush({ message: 'Unauthenticated.' }, { status: 401, statusText: 'Unauthorized' });

      expect(await token).toBeNull();
      expect(await storage.getAccessToken()).toBeNull();
      expect(await storage.getRefreshToken()).toBeNull();
      expect(auth.isAuthenticated()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('does not call the endpoint when there is no refresh token', async () => {
      await auth.hydrate();

      expect(await auth.refresh()).toBeNull();
      httpMock.expectNone(`${BASE_URL}/v1/auth/refresh`);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('logout', () => {
    it('clears the device even when the server call fails', async () => {
      await withSession();

      const done = auth.logout();
      httpMock
        .expectOne(`${BASE_URL}/v1/auth/logout`)
        .flush({ message: 'Service Unavailable' }, { status: 503, statusText: 'Unavailable' });

      // Leaving the tokens on the device because the network was down turns an
      // explicit logout into a session that is still open.
      await expectAsync(done).toBeResolved();
      expect(await storage.getAccessToken()).toBeNull();
      expect(await storage.getRefreshToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('login', () => {
    it('stores the pair it receives', async () => {
      const done = auth.login({ email: 'jane@example.test', password: 'secret123' });

      httpMock.expectOne(`${BASE_URL}/v1/auth/login`).flush(pair(ACCESS, REFRESH));
      await done;

      expect(await storage.getAccessToken()).toBe(ACCESS);
      expect(auth.isAuthenticated()).toBeTrue();
    });

    it('propagates bad credentials to the caller', async () => {
      const done = auth.login({ email: 'jane@example.test', password: 'wrong' });

      httpMock.expectOne(`${BASE_URL}/v1/auth/login`).flush(
        { message: 'The provided credentials are incorrect.', errors: { email: ['bad'] } },
        { status: 422, statusText: 'Unprocessable Content' }
      );

      await expectAsync(done).toBeRejected();
      expect(auth.isAuthenticated()).toBeFalse();
      await settle();
    });
  });
});
