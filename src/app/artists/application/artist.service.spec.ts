import { TestBed } from '@angular/core/testing';

import { ArtistService } from './artist.service';
import { ArtistRepository, ArtistListFilters } from '../domain/artist.repository';
import { Artist } from '../domain/artist.model';
import { PaginatedResponse } from '../../shared/domain/pagination.model';

const ARTIST: Artist = {
  id: 'a20c46cf-2c90-4a40-b83b-d5fa7755a33e',
  name: 'Artur Artist',
  bio: null,
  instagram: null,
  website: null,
  graffitiCount: 24,
};

function page(data: Artist[]): PaginatedResponse<Artist> {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 1, from: 1, last_page: 1,
      per_page: 20, to: data.length, total: data.length,
    },
  };
}

class StubArtistRepository extends ArtistRepository {
  lastFilters: ArtistListFilters | undefined;
  listResult: Promise<PaginatedResponse<Artist>> = Promise.resolve(page([ARTIST]));
  oneResult: Promise<Artist> = Promise.resolve(ARTIST);

  getList(filters?: ArtistListFilters): Promise<PaginatedResponse<Artist>> {
    this.lastFilters = filters;

    return this.listResult;
  }

  getById(): Promise<Artist> {
    return this.oneResult;
  }
}

describe('ArtistService', () => {
  let service: ArtistService;
  let repo: StubArtistRepository;

  beforeEach(() => {
    repo = new StubArtistRepository();
    TestBed.configureTestingModule({
      providers: [{ provide: ArtistRepository, useValue: repo }],
    });
    service = TestBed.inject(ArtistService);
  });

  it('loads the list and clears the loading flag', async () => {
    await service.loadList();

    expect(service.artists().length).toBe(1);
    expect(service.artists()[0].name).toBe('Artur Artist');
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('asks for the requested page', async () => {
    await service.loadList(3);

    expect(repo.lastFilters?.page).toBe(3);
  });

  it('surfaces an error instead of leaving the list stale', async () => {
    repo.listResult = Promise.reject(new Error('network down'));

    await service.loadList();

    expect(service.error()).toBe('No se pudo cargar los artistas.');
    expect(service.loading()).toBe(false);
  });

  it('loads one artist', async () => {
    await service.loadOne(ARTIST.id);

    expect(service.selected()?.id).toBe(ARTIST.id);
    expect(service.error()).toBeNull();
  });

  it('leaves no stale artist selected when the detail fails', async () => {
    await service.loadOne(ARTIST.id);
    repo.oneResult = Promise.reject(new Error('gone'));

    await service.loadOne('a20c46cf-0000-4000-8000-000000000000');

    expect(service.selected()).toBeNull();
    expect(service.error()).toBe('No se pudo cargar el artista.');
  });
});
