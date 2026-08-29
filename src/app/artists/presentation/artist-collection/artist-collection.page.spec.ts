import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { ArtistCollectionPage } from './artist-collection.page';
import { ArtistRepository, ArtistListFilters } from '../../domain/artist.repository';
import { Artist } from '../../domain/artist.model';
import { GraffitiRepository } from '../../../graffiti/domain/repositories/graffiti.repository';
import { GraffitiFilters } from '../../../graffiti/domain/models/graffiti-filters.model';
import { Graffiti } from '../../../graffiti/domain/models/graffiti.model';
import { PaginatedResponse } from '../../../shared/domain/pagination.model';

const ARTIST_ID = 'a20c46cf-2c90-4a40-b83b-d5fa7755a33e';

const ARTIST: Artist = {
  id: ARTIST_ID,
  name: 'Artur Artist',
  bio: 'Seeded example artist.',
  instagram: null,
  website: null,
  graffitiCount: 1,
};

function graffiti(id: string): Graffiti {
  return {
    id,
    category: 'a20c46cf-596c-4481-a214-ec3f025b83a8',
    artist: { id: ARTIST_ID, name: 'Artur Artist' },
    latitude: 0,
    longitude: 0,
    vote: 0,
    active: true,
    cover: '',
    sightings: [],
  };
}

function page<T>(data: T[]): PaginatedResponse<T> {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 1, from: 1, last_page: 1,
      per_page: 30, to: data.length, total: data.length,
    },
  };
}

class StubArtistRepository extends ArtistRepository {
  getList(_filters?: ArtistListFilters): Promise<PaginatedResponse<Artist>> {
    return Promise.resolve(page([ARTIST]));
  }

  getById(): Promise<Artist> {
    return Promise.resolve(ARTIST);
  }
}

class StubGraffitiRepository extends GraffitiRepository {
  lastFilters: GraffitiFilters | undefined;
  result: Graffiti[] = [graffiti('a20c46cf-836b-42d8-9a96-67189aa8490f')];

  getList(filters: GraffitiFilters = {}): Promise<PaginatedResponse<Graffiti>> {
    this.lastFilters = filters;

    return Promise.resolve(page(this.result));
  }

  getById(id: string): Promise<Graffiti> {
    return Promise.resolve(graffiti(id));
  }
}

describe('ArtistCollectionPage', () => {
  let graffitis: StubGraffitiRepository;

  async function render(): Promise<ComponentFixture<ArtistCollectionPage>> {
    await TestBed.configureTestingModule({
      imports: [ArtistCollectionPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ArtistRepository, useClass: StubArtistRepository },
        { provide: GraffitiRepository, useValue: graffitis },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: ARTIST_ID }) } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ArtistCollectionPage);
    // detectChanges runs ngOnInit, which chains two awaited loads. Drain the
    // microtask queue before asserting on the rendered DOM.
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    await fixture.whenStable();

    return fixture;
  }

  beforeEach(() => {
    graffitis = new StubGraffitiRepository();
  });

  it('asks the API for that artist only', async () => {
    await render();

    expect(graffitis.lastFilters?.artist).toBe(ARTIST_ID);
  });

  it('shows the artist name and their work', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Artur Artist');
    expect(el.querySelectorAll('gm-graffiti-card').length).toBe(1);
  });

  /** An artist with no attributed work is a valid entry, not a failure. */
  it('says so when the artist has no work, without erroring', async () => {
    graffitis.result = [];

    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Todavía no hay obra atribuida');
    expect(el.querySelectorAll('gm-graffiti-card').length).toBe(0);
  });
});
