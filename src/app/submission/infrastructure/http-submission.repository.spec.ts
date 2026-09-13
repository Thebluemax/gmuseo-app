import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { SubmissionRepository } from '../domain/submission.repository';
import { HttpSubmissionRepository } from './http-submission.repository';
import { NewGraffiti } from '../domain/models/submission.model';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';
import { SecureTokenStorage } from '../../auth/domain/token-storage';

const BASE_URL = '/api';
const CATEGORY = 'a20c46cf-596c-4481-a214-ec3f025b83a8';
const ARTIST = 'a20c46cf-2c90-4a40-b83b-d5fa7755a33e';

class StubTokenStorage {
  getAccessToken(): Promise<string | null> {
    return Promise.resolve(null);
  }
}

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
  let sentForm: FormData | undefined;

  beforeEach(() => {
    sentForm = undefined;
    spyOn(globalThis, 'fetch').and.callFake((_url: RequestInfo | URL, init?: RequestInit) => {
      sentForm = init?.body as FormData;

      return Promise.resolve(
        new Response(JSON.stringify({ data: { id: 'a20c46cf-836b-42d8-9a96-67189aa8490f' } }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        { provide: SecureTokenStorage, useClass: StubTokenStorage },
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
    await repo.create(base(), [new Blob(['x'], { type: 'image/jpeg' })]);

    expect(sentForm?.has('artist_id')).toBe(false);
    expect(sentForm?.get('category')).toBe(CATEGORY);
  });

  it('sends artist_id when one was chosen', async () => {
    await repo.create({ ...base(), artistId: ARTIST }, [new Blob(['x'], { type: 'image/jpeg' })]);

    expect(sentForm?.get('artist_id')).toBe(ARTIST);
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
