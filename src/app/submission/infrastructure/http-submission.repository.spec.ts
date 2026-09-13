import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { SubmissionRepository, UploadProgress } from '../domain/submission.repository';
import { HttpSubmissionRepository } from './http-submission.repository';
import { NewGraffiti, UnauthorizedError, ValidationError } from '../domain/models/submission.model';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';
import { SecureTokenStorage } from '../../auth/domain/token-storage';
import { UPLOAD_REQUEST, createUploadRequest } from './upload-request';

const BASE_URL = '/api';
const CATEGORY = 'a20c46cf-596c-4481-a214-ec3f025b83a8';
const ARTIST = 'a20c46cf-2c90-4a40-b83b-d5fa7755a33e';

class StubTokenStorage {
  token: string | null = null;
  getAccessToken(): Promise<string | null> {
    return Promise.resolve(this.token);
  }
}

/**
 * The XHR the upload uses, without the network: records what was sent and
 * lets the test play the server (progress, a status with a body, a dropped
 * connection).
 */
class FakeXhr {
  method = '';
  url = '';
  headers: Record<string, string> = {};
  body: FormData | null = null;
  status = 0;
  responseText = '';
  upload = { onprogress: null as ((e: ProgressEvent) => void) | null, onload: null as (() => void) | null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;

  open(method: string, url: string): void { this.method = method; this.url = url; }
  setRequestHeader(name: string, value: string): void { this.headers[name] = value; }
  send(body: FormData): void { this.body = body; }

  progress(loaded: number, total: number): void {
    this.upload.onprogress?.(new ProgressEvent('progress', { lengthComputable: true, loaded, total }));
  }
  bodySent(): void { this.upload.onload?.(); }
  respond(status: number, body: unknown): void {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.onload?.();
  }
  drop(): void { this.onerror?.(); }
}

const CREATED = { data: { id: 'a20c46cf-836b-42d8-9a96-67189aa8490f' } };

function base(): NewGraffiti {
  return { category: CATEGORY, latitude: 41.38, longitude: 2.16 };
}

/**
 * `create()` bypasses HttpClient (CapacitorHttp corrupts multipart bodies on
 * native), so the multipart shape is asserted through a stubbed global fetch.
 */
describe('HttpSubmissionRepository', () => {
  let repo: SubmissionRepository;
  let http: HttpTestingController;
  let tokens: StubTokenStorage;
  let xhr: FakeXhr;

  /** Starts a create and lets the repository reach `send()` before the test plays the server. */
  async function creating(graffiti: NewGraffiti = base(), onProgress?: (p: UploadProgress) => void): Promise<{ pending: Promise<string> }> {
    const pending = repo.create(graffiti, [new Blob(['x'], { type: 'image/jpeg' })], onProgress);
    pending.catch(() => undefined); // the test decides whether to await the rejection
    await Promise.resolve();
    await Promise.resolve();
    return { pending };
  }

  beforeEach(() => {
    xhr = new FakeXhr();
    tokens = new StubTokenStorage();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        { provide: SecureTokenStorage, useValue: tokens },
        { provide: UPLOAD_REQUEST, useValue: () => xhr },
        { provide: SubmissionRepository, useClass: HttpSubmissionRepository },
      ],
    });
    repo = TestBed.inject(SubmissionRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /**
   * Unknown authorship is the absence of an artist. Sending an empty or invented
   * `artist_id` would be rejected with 422 — there is no anonymous artist row.
   */
  it('omits artist_id entirely when no artist was chosen', async () => {
    const { pending } = await creating();
    xhr.respond(201, CREATED);
    await pending;

    expect(xhr.body?.has('artist_id')).toBe(false);
    expect(xhr.body?.get('category')).toBe(CATEGORY);
  });

  it('sends artist_id when one was chosen', async () => {
    const { pending } = await creating({ ...base(), artistId: ARTIST });
    xhr.respond(201, CREATED);
    await pending;

    expect(xhr.body?.get('artist_id')).toBe(ARTIST);
  });

  describe('the request', () => {
    it('posts the multipart to the create route with the bearer and Accept, and no Content-Type', async () => {
      tokens.token = 'tok-123';
      const { pending } = await creating();
      xhr.respond(201, CREATED);

      expect(await pending).toBe('a20c46cf-836b-42d8-9a96-67189aa8490f');
      expect(xhr.method).toBe('POST');
      expect(xhr.url).toBe(`${BASE_URL}/v1/graffitis`);
      expect(xhr.headers).toEqual({ Accept: 'application/json', Authorization: 'Bearer tok-123' });
      expect(xhr.body).toBeInstanceOf(FormData);
    });

    it('sends no Authorization header when there is no token', async () => {
      const { pending } = await creating();
      xhr.respond(201, CREATED);
      await pending;

      expect('Authorization' in xhr.headers).toBe(false);
    });
  });

  describe('progress', () => {
    it('reports how much of the body has been sent, then that all of it has', async () => {
      const seen: UploadProgress[] = [];
      const { pending } = await creating(base(), (p) => seen.push(p));

      xhr.progress(30, 100);
      xhr.progress(100, 100);
      xhr.bodySent();
      xhr.respond(201, CREATED);
      await pending;

      expect(seen).toEqual([{ sent: 30, total: 100 }, { sent: 100, total: 100 }, { sent: 100, total: 100 }]);
    });

    /** With no progress event at all, the end of the upload is still told, so the page can change phase. */
    it('still reports the end of the upload when no progress event came', async () => {
      const seen: UploadProgress[] = [];
      const { pending } = await creating(base(), (p) => seen.push(p));

      xhr.bodySent();
      xhr.respond(201, CREATED);
      await pending;

      expect(seen).toEqual([{ sent: 1, total: 1 }]);
    });
  });

  describe('failures', () => {
    it('turns a 401 into UnauthorizedError', async () => {
      const { pending } = await creating();
      xhr.respond(401, { message: 'Unauthenticated.' });

      await expectAsync(pending).toBeRejectedWithError(UnauthorizedError);
    });

    it('turns a 422 into ValidationError carrying the server\'s field messages', async () => {
      const { pending } = await creating();
      xhr.respond(422, {
        message: 'The files.0 must not be greater than 10240 kilobytes.',
        errors: { 'files.0': ['The files.0 must not be greater than 10240 kilobytes.'], files: ['Too many.'] },
      });

      const err = await pending.then(() => null, (e: unknown) => e as ValidationError);
      expect(err).toBeInstanceOf(ValidationError);
      expect(err?.message).toBe('The files.0 must not be greater than 10240 kilobytes. Too many.');
      expect(err?.errors['files']).toEqual(['Too many.']);
    });

    it('turns any other status into a plain error naming it', async () => {
      const { pending } = await creating();
      xhr.respond(500, { message: 'Server Error' });

      await expectAsync(pending).toBeRejectedWithError(Error, 'La creación del graffiti falló (HTTP 500).');
    });

    it('turns a dropped connection into a plain error that invites a retry', async () => {
      const { pending } = await creating();
      xhr.drop();

      await expectAsync(pending).toBeRejectedWithError(Error, /No se pudo enviar el graffiti/);
    });

    it('rejects a 201 without an id', async () => {
      const { pending } = await creating();
      xhr.respond(201, { data: {} });

      await expectAsync(pending).toBeRejectedWithError(Error, 'La respuesta de creación no incluyó un id.');
    });
  });

  it('reads the artist list from the paginated envelope', async () => {
    const pending = repo.listArtists();

    http.expectOne(`${BASE_URL}/v1/artists`).flush({
      data: [{ id: ARTIST, name: 'Artur Artist', bio: null, instagram: null, website: null, graffiti_count: 3 }],
      links: { first: null, last: null, prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, per_page: 20, to: 1, total: 1 },
    });

    const artists = await pending;

    expect(artists).toEqual([{ id: ARTIST, name: 'Artur Artist' }]);
  });
});

/**
 * The bypass rests on Capacitor keeping the original XHR methods in
 * `CapacitorWebXMLHttpRequest`. If a Capacitor upgrade stops keeping one of
 * them, this fails here and not on a phone mid-upload.
 */
describe('createUploadRequest', () => {
  const globalWithBridge = globalThis as { CapacitorWebXMLHttpRequest?: unknown };
  let saved: unknown;

  beforeEach(() => { saved = globalWithBridge.CapacitorWebXMLHttpRequest; });
  afterEach(() => {
    if (saved === undefined) delete globalWithBridge.CapacitorWebXMLHttpRequest;
    else globalWithBridge.CapacitorWebXMLHttpRequest = saved;
  });

  it('returns a plain XMLHttpRequest on the web, where nothing is patched', () => {
    delete globalWithBridge.CapacitorWebXMLHttpRequest;

    expect(createUploadRequest()).toBeInstanceOf(XMLHttpRequest);
  });

  it('restores the four original methods on the instance when the bridge keeps them', () => {
    const originals = {
      open: XMLHttpRequest.prototype.open,
      send: XMLHttpRequest.prototype.send,
      setRequestHeader: XMLHttpRequest.prototype.setRequestHeader,
      abort: XMLHttpRequest.prototype.abort,
    };
    globalWithBridge.CapacitorWebXMLHttpRequest = originals;

    const xhr = createUploadRequest();

    for (const method of ['open', 'send', 'setRequestHeader', 'abort'] as const) {
      expect(Object.prototype.hasOwnProperty.call(xhr, method)).withContext(method).toBe(true);
      expect(xhr[method]).toBe(originals[method]);
    }
  });

  it('fails loudly when the bridge no longer keeps one of them', () => {
    globalWithBridge.CapacitorWebXMLHttpRequest = {
      open: XMLHttpRequest.prototype.open,
      send: XMLHttpRequest.prototype.send,
      setRequestHeader: XMLHttpRequest.prototype.setRequestHeader,
    };

    expect(() => createUploadRequest()).toThrowError(/abort/);
  });
});
