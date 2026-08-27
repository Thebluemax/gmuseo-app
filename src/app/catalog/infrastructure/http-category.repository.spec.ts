import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { CategoryRepository } from '../domain/category.repository';
import { HttpCategoryRepository } from './http-category.repository';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';
import { GraffitiRepository } from '../../graffiti/domain/repositories/graffiti.repository';
import { HttpGraffitiRepository } from '../../graffiti/infrastructure/repositories/http-graffiti.repository';

const BASE_URL = '/api';

function graffitiPage(data: unknown[]) {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 1, from: 1, last_page: 1,
      per_page: 1, to: data.length, total: data.length,
    },
  };
}

/**
 * `GET /api/v1/categories` answers with a bare array — no `{data, links, meta}`
 * envelope, unlike `/graffitis`. These tests pin that shape: assuming a
 * paginated wrapper breaks them.
 */
describe('HttpCategoryRepository', () => {
  let repo: CategoryRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        { provide: GraffitiRepository, useClass: HttpGraffitiRepository },
        { provide: CategoryRepository, useClass: HttpCategoryRepository },
      ],
    });
    repo = TestBed.inject(CategoryRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps the bare array returned by the API', async () => {
    const pending = repo.getList();

    const req = http.expectOne(`${BASE_URL}/v1/categories`);
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'a20c46cf-57f4-4c1d-b358-df1c0c34e986',
        name: 'Tag',
        description: 'One colour, the artist identifier.',
      },
      {
        id: 'a20c46cf-5866-43d8-831f-c1a3d2559d5f',
        name: 'Throw-up',
        description: 'Two or more colours, bubble lettering.',
      },
    ]);

    const categories = await pending;

    expect(categories.length).toBe(2);
    expect(categories[0].id).toBe('a20c46cf-57f4-4c1d-b358-df1c0c34e986');
    expect(categories[0].name).toBe('Tag');
    expect(categories[1].name).toBe('Throw-up');
  });

  it('keeps identifiers as opaque strings, never numbers', async () => {
    const pending = repo.getList();

    http.expectOne(`${BASE_URL}/v1/categories`).flush([
      { id: 'a20c46cf-58e0-491a-8cea-2e6b2a491be7', name: 'Wildstyle', description: '' },
    ]);

    const [category] = await pending;

    expect(typeof category.id).toBe('string');
    expect(Number.isNaN(Number(category.id))).toBe(true);
  });

  it('exposes no image field: the API does not carry one', async () => {
    const pending = repo.getList();

    http.expectOne(`${BASE_URL}/v1/categories`).flush([
      { id: 'a20c46cf-57f4-4c1d-b358-df1c0c34e986', name: 'Tag', description: '' },
    ]);

    const [category] = await pending;

    expect(Object.keys(category)).not.toContain('image');
  });

  it('fetches a single category by UUID', async () => {
    const id = 'a20c46cf-57f4-4c1d-b358-df1c0c34e986';
    const pending = repo.getById(id);

    const req = http.expectOne(`${BASE_URL}/v1/categories/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush({ id, name: 'Tag', description: 'One colour.' });

    expect((await pending).name).toBe('Tag');
  });

  describe('getCoverImage', () => {
    const CATEGORY_ID = 'a20c46cf-596c-4481-a214-ec3f025b83a8';

    /** The cover is borrowed from a graffiti: the API carries no category image. */
    it('borrows the grid variant of the first sighting photo', async () => {
      const pending = repo.getCoverImage(CATEGORY_ID);

      const req = http.expectOne(
        (r) => r.url === `${BASE_URL}/v1/graffitis`
      );
      expect(req.request.params.get('category')).toBe(CATEGORY_ID);
      expect(req.request.params.get('per_page')).toBe('1');
      req.flush(
        graffitiPage([
          {
            id: 'a20c46cf-836b-42d8-9a96-67189aa8490f',
            category: CATEGORY_ID,
            latitude: -5.6, longitude: 65.3, vote: 1, active: true,
            cover: '/gmuseo/cover_700.jpg',
            sightings: [
              {
                id: 'a20c46cf-9586-4703-aa52-fda662272d2e',
                spotted_by: 'Artur Artist',
                spotted_at: '2026-05-17T07:03:35.000000Z',
                state: 'intact',
                description: null,
                photos: [
                  {
                    id: 'a20c46cf-9670-4025-82f4-80e63c4accc8',
                    files: {
                      lg: '/gmuseo/photo_1900.jpg',
                      md: '/gmuseo/photo_700.jpg',
                      sm: '/gmuseo/photo_350.jpg',
                      thumb: '/gmuseo/photo_150.jpg',
                    },
                    owner: 'Artur Artist',
                    created_at: '2026-05-17T07:03:35.000000Z',
                    updated_at: '2026-05-17T07:03:35.000000Z',
                  },
                ],
              },
            ],
          },
        ])
      );

      expect(await pending).toBe(`${environment.mediaUrl}/gmuseo/photo_350.jpg`);
    });

    it('falls back to the graffiti cover when no sighting carries a photo', async () => {
      const pending = repo.getCoverImage(CATEGORY_ID);

      http.expectOne((r) => r.url === `${BASE_URL}/v1/graffitis`).flush(
        graffitiPage([
          {
            id: 'a20c46cf-836b-42d8-9a96-67189aa8490f',
            category: CATEGORY_ID,
            latitude: -5.6, longitude: 65.3, vote: 0, active: true,
            cover: '/gmuseo/cover_700.jpg',
            sightings: [],
          },
        ])
      );

      expect(await pending).toBe(`${environment.mediaUrl}/gmuseo/cover_700.jpg`);
    });

    it('answers null for a category with no graffiti', async () => {
      const pending = repo.getCoverImage(CATEGORY_ID);

      http.expectOne((r) => r.url === `${BASE_URL}/v1/graffitis`).flush(graffitiPage([]));

      expect(await pending).toBeNull();
    });
  });
});
