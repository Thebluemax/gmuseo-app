import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { ChangeServerUseCase } from './change-server.use-case';
import { AuthService } from './auth.service';
import { AuthRepository } from '../domain/auth.repository';
import { SecureTokenStorage } from '../domain/token-storage';
import { SanctumAuthRepository } from '../infrastructure/sanctum-auth.repository';
import { authInterceptor } from '../infrastructure/auth.interceptor';
import { provideApiBaseUrl, ServerConfig } from '../../shared/application/server-config';
import { ServerUrlStore } from '../../shared/domain/server-url.store';
import { ServerUrlError } from '../../shared/domain/server-url';

const CURRENT = 'https://gmuseo.maximilianofernandez.net/api';
const LAN = 'http://192.168.0.154/api';
const ACCESS = '1|access-token-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const REFRESH = '2|refresh-token-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

class StubStore extends ServerUrlStore {
  url: string | null = CURRENT;
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

/** The probe and the logout cross promise hops before the next request is queued. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

async function refusal(pending: Promise<void>): Promise<ServerUrlError> {
  try {
    await pending;
  } catch (err) {
    if (err instanceof ServerUrlError) return err;
    throw err;
  }
  throw new Error('expected the change to be refused');
}

describe('ChangeServerUseCase', () => {
  let useCase: ChangeServerUseCase;
  let http: HttpTestingController;
  let store: StubStore;
  let tokens: StubTokenStorage;
  let config: ServerConfig;
  let restart: jasmine.Spy;

  beforeEach(async () => {
    store = new StubStore();
    tokens = new StubTokenStorage();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: ServerUrlStore, useValue: store },
        provideApiBaseUrl(),
        { provide: SecureTokenStorage, useValue: tokens },
        { provide: AuthRepository, useClass: SanctumAuthRepository },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    });
    config = TestBed.inject(ServerConfig);
    await config.load();
    restart = spyOn(config, 'restart');
    http = TestBed.inject(HttpTestingController);
    useCase = TestBed.inject(ChangeServerUseCase);
  });

  afterEach(() => http.verify());

  it('saves a server that answers /v1/version and restarts on it', async () => {
    const pending = useCase.execute('http://192.168.0.154');

    const probe = http.expectOne(`${LAN}/v1/version`);
    expect(probe.request.method).toBe('GET');
    expect(probe.request.headers.get('Accept')).toBe('application/json');
    probe.flush({ version: '1.4.0' });
    await pending;

    expect(store.url).toBe(LAN);
    expect(config.apiUrl()).toBe(LAN);
    expect(restart).toHaveBeenCalled();
  });

  it('does not save a server that does not answer, and says so', async () => {
    const pending = useCase.execute('https://down.example.test');

    http
      .expectOne('https://down.example.test/api/v1/version')
      .error(new ProgressEvent('error'), { status: 0 });
    const err = await refusal(pending);

    expect(err.kind).toBe('unreachable');
    expect(err.message).toContain('https://down.example.test/api/v1/version');
    expect(err.message).toContain('no responde');
    expect(store.url).toBe(CURRENT);
    expect(config.apiUrl()).toBe(CURRENT);
    expect(restart).not.toHaveBeenCalled();
  });

  it('does not save a server that answers but has no /v1/version', async () => {
    const pending = useCase.execute('https://other.example.test');

    http
      .expectOne('https://other.example.test/api/v1/version')
      .flush('Not Found', { status: 404, statusText: 'Not Found' });
    const err = await refusal(pending);

    expect(err.kind).toBe('unreachable');
    expect(err.message).toContain('404');
    expect(store.url).toBe(CURRENT);
    expect(restart).not.toHaveBeenCalled();
  });

  it('rejects http to a host outside the cleartext whitelist without probing it', async () => {
    const err = await refusal(useCase.execute('http://gmuseo.maximilianofernandez.net'));

    expect(err.kind).toBe('cleartext');
    http.expectNone(() => true);
    expect(store.url).toBe(CURRENT);
    expect(restart).not.toHaveBeenCalled();
  });

  it('rejects a value that is not an absolute URL', async () => {
    const err = await refusal(useCase.execute('192.168.0.154'));

    expect(err.kind).toBe('invalid');
    http.expectNone(() => true);
    expect(store.url).toBe(CURRENT);
  });

  it('does nothing when the server is the one already in use', async () => {
    await useCase.execute(CURRENT);

    http.expectNone(() => true);
    expect(restart).not.toHaveBeenCalled();
  });

  describe('with a session open', () => {
    let auth: AuthService;

    beforeEach(async () => {
      tokens.access = ACCESS;
      tokens.refresh = REFRESH;
      auth = TestBed.inject(AuthService);
      await auth.hydrate();
    });

    /**
     * The tokens belong to the server that issued them. They are revoked
     * there and wiped from the device before the app restarts; the probe is
     * the only request that reaches the new server first, and it carries none.
     */
    it('closes the session and clears the tokens before the first request to the new server', async () => {
      const pending = useCase.execute(LAN);

      const probe = http.expectOne(`${LAN}/v1/version`);
      expect(probe.request.headers.has('Authorization')).toBeFalse();
      probe.flush({ version: '1.4.0' });
      await settle();

      // Revoked on the server that issued them, with the token they revoke.
      const logout = http.expectOne(`${CURRENT}/v1/auth/logout`);
      expect(logout.request.headers.get('Authorization')).toBe(`Bearer ${ACCESS}`);
      expect(store.url).toBe(CURRENT);
      expect(restart).not.toHaveBeenCalled();
      logout.flush({ message: 'Tokens revoked' });
      await pending;

      expect(auth.isAuthenticated()).toBeFalse();
      expect(tokens.access).toBeNull();
      expect(tokens.refresh).toBeNull();
      expect(store.url).toBe(LAN);
      expect(restart).toHaveBeenCalled();
    });

    it('still clears the tokens when the old server cannot revoke them', async () => {
      const pending = useCase.execute(LAN);

      http.expectOne(`${LAN}/v1/version`).flush({ version: '1.4.0' });
      await settle();
      http
        .expectOne(`${CURRENT}/v1/auth/logout`)
        .error(new ProgressEvent('error'), { status: 0 });
      await pending;

      expect(tokens.access).toBeNull();
      expect(tokens.refresh).toBeNull();
      expect(store.url).toBe(LAN);
      expect(restart).toHaveBeenCalled();
    });

    it('keeps the session when the new server is refused', async () => {
      const pending = useCase.execute('https://down.example.test');

      http
        .expectOne('https://down.example.test/api/v1/version')
        .error(new ProgressEvent('error'), { status: 0 });
      await refusal(pending);

      expect(auth.isAuthenticated()).toBeTrue();
      expect(tokens.access).toBe(ACCESS);
    });
  });
});
