import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ArtistRepository } from '../domain/artist.repository';
import { HttpArtistRepository } from './http-artist.repository';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';

const BASE_URL = '/api';

function artistPage(data: unknown[]) {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 1, from: 1, last_page: 1,
      per_page: 20, to: data.length, total: data.length,
    },
  };
}

const ARTIST_DTO = {
  id: 'a20c46cf-2c90-4a40-b83b-d5fa7755a33e',
  name: 'Artur Artist',
  bio: 'Seeded example artist.',
  instagram: 'artur.artist',
  website: null,
  graffiti_count: 24,
};

/**
 * `GET /api/v1/artists` answers with a `{data, links, meta}` envelope — unlike
 * `/v1/categories`, which returns a bare array. These tests pin that shape:
 * assuming a plain array breaks them.
 */
describe('HttpArtistRepository', () => {
  let repo: ArtistRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        { provide: ArtistRepository, useClass: HttpArtistRepository },
      ],
    });
    repo = TestBed.inject(ArtistRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps the paginated envelope, not a bare array', async () => {
    const pending = repo.getList();

    const req = http.expectOne((r) => r.url === `${BASE_URL}/v1/artists`);
    expect(req.request.method).toBe('GET');
    req.flush(artistPage([ARTIST_DTO]));

    const page = await pending;

    expect(page.data.length).toBe(1);
    expect(page.meta.total).toBe(1);
    expect(page.data[0].name).toBe('Artur Artist');
    expect(page.data[0].graffitiCount).toBe(24);
  });

  it('sends pagination as page and per_page', async () => {
    const pending = repo.getList({ page: 2, perPage: 50 });

    const req = http.expectOne((r) => r.url === `${BASE_URL}/v1/artists`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('per_page')).toBe('50');
    req.flush(artistPage([]));

    await pending;
  });

  /**
   * An artist is a catalogue entry, not an account. The API never publishes the
   * link to a platform account, and the client must not reintroduce it: in this
   * domain, tying a street name to a registered person is a harm that deleting
   * the field later does not repair.
   */
  it('exposes no account data, even if the payload carried some', async () => {
    const pending = repo.getById(ARTIST_DTO.id);

    http.expectOne(`${BASE_URL}/v1/artists/${ARTIST_DTO.id}`).flush({
      data: {
        ...ARTIST_DTO,
        user_id: 'a20c46cf-0000-4000-8000-000000000000',
        username: 'artur',
        avatar: '/avatars/artur.png',
        about_me: 'private profile text',
        twitter: '@artur',
      },
    });

    const artist = await pending;

    expect(Object.keys(artist).sort()).toEqual(
      ['bio', 'graffitiCount', 'id', 'instagram', 'name', 'website']
    );
    for (const forbidden of ['user_id', 'username', 'avatar', 'about_me', 'twitter']) {
      expect(Object.keys(artist)).not.toContain(forbidden);
    }
  });

  it('keeps the identifier an opaque string', async () => {
    const pending = repo.getById(ARTIST_DTO.id);

    http.expectOne(`${BASE_URL}/v1/artists/${ARTIST_DTO.id}`).flush({ data: ARTIST_DTO });

    const artist = await pending;

    expect(typeof artist.id).toBe('string');
    expect(Number.isNaN(Number(artist.id))).toBe(true);
  });
});
