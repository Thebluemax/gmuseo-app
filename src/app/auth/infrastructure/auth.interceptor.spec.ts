import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../application/auth.service';
import { AuthRepository } from '../domain/auth.repository';
import { SecureTokenStorage } from '../domain/token-storage';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';
import { SanctumAuthRepository } from './sanctum-auth.repository';

const BASE_URL = '/api';
const ACCESS = '1|access-token-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const REFRESH = '2|refresh-token-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

/** In-memory stand-in for the OS keystore. */
class StubTokenStorage extends SecureTokenStorage {
  access: string | null = null;
  refresh: string | null = null;

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
  }
}

/**
 * The refresh path crosses several promise hops (repository, then the secure
 * storage write) before the retry is queued. One microtask is not enough to see
 * it; a macrotask is, and it keeps the test free of fake timers.
 */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let storage: StubTokenStorage;
  let auth: AuthService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        { provide: SecureTokenStorage, useClass: StubTokenStorage },
        // The real repository: this test is about the request it builds.
        { provide: AuthRepository, useClass: SanctumAuthRepository },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(SecureTokenStorage) as StubTokenStorage;
    auth = TestBed.inject(AuthService);

    storage.access = ACCESS;
    storage.refresh = REFRESH;
    await auth.hydrate();
  });

  afterEach(() => httpMock.verify());

  it('attaches the access token and forces JSON on API requests', () => {
    http.get(`${BASE_URL}/v1/graffitis`).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/v1/graffitis`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${ACCESS}`);
    expect(req.request.headers.get('Accept')).toBe('application/json');
    req.flush({});
  });

  it('leaves requests outside the API alone', () => {
    http.get('https://media.example.test/photo.jpg').subscribe();

    const req = httpMock.expectOne('https://media.example.test/photo.jpg');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  // The defect this change exists for: logout used the same context as login and
  // refresh, so the interceptor skipped the Authorization header entirely. The
  // server answered 401, AuthService swallowed it, and nothing was ever revoked.
  it('sends logout authenticated', async () => {
    const done = auth.logout();

    const req = httpMock.expectOne(`${BASE_URL}/v1/auth/logout`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${ACCESS}`);
    req.flush({ message: 'Tokens revoked' });
    await done;
  });

  it('does not refresh when logout is rejected', async () => {
    const done = auth.logout();

    httpMock
      .expectOne(`${BASE_URL}/v1/auth/logout`)
      .flush({ message: 'Unauthenticated.' }, { status: 401, statusText: 'Unauthorized' });

    // Renewing the session in order to end it would hand back a fresh pair.
    httpMock.expectNone(`${BASE_URL}/v1/auth/refresh`);
    await done;
    expect(await storage.getAccessToken()).toBeNull();
  });

  it('keeps login anonymous', async () => {
    const pending = auth.login({ email: 'jane@example.test', password: 'secret123' });

    const req = httpMock.expectOne(`${BASE_URL}/v1/auth/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({
      data: {
        access_token: ' 3|new-access',
        refresh_token: '4|new-refresh',
        token_type: 'Bearer',
        expires_in: 900,
      },
    });
    await pending;
  });

  it('refreshes once on a 401 and retries the original request', async () => {
    const seen: unknown[] = [];
    http.get(`${BASE_URL}/v1/graffitis`).subscribe((r) => seen.push(r));

    httpMock
      .expectOne(`${BASE_URL}/v1/graffitis`)
      .flush({ message: 'Unauthenticated.' }, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne(`${BASE_URL}/v1/auth/refresh`);
    expect(refresh.request.headers.get('Authorization')).toBe(`Bearer ${REFRESH}`);
    refresh.flush({
      data: {
        access_token: '5|rotated-access',
        refresh_token: '6|rotated-refresh',
        token_type: 'Bearer',
        expires_in: 900,
      },
    });

    await settle();
    const retried = httpMock.expectOne(`${BASE_URL}/v1/graffitis`);
    expect(retried.request.headers.get('Authorization')).toBe('Bearer 5|rotated-access');
    retried.flush({ ok: true });
  });

  it('does not chain a second refresh when the refresh itself fails', async () => {
    http.get(`${BASE_URL}/v1/graffitis`).subscribe({ error: () => undefined });

    httpMock
      .expectOne(`${BASE_URL}/v1/graffitis`)
      .flush({ message: 'Unauthenticated.' }, { status: 401, statusText: 'Unauthorized' });

    httpMock
      .expectOne(`${BASE_URL}/v1/auth/refresh`)
      .flush({ message: 'Unauthenticated.' }, { status: 401, statusText: 'Unauthorized' });

    await settle();
    httpMock.expectNone(`${BASE_URL}/v1/auth/refresh`);
  });
});
