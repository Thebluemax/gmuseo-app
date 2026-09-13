import { TestBed } from '@angular/core/testing';

import { GraffitiFeedService } from './graffiti-feed.service';
import { LoadGraffitiListUseCase } from '../usecases/load-graffiti-list.usecase';
import { Graffiti } from '../../domain/models/graffiti.model';
import { GraffitiFilters } from '../../domain/models/graffiti-filters.model';
import { PaginatedResponse } from '../../../shared/domain/pagination.model';

function graffiti(id: string): Graffiti {
  return {
    id,
    category: 'a20c46cf-596c-4481-a214-ec3f025b83a8',
    artist: null,
    latitude: 0,
    longitude: 0,
    createdAt: null,
    vote: 0,
    active: true,
    cover: '',
    photos: [],
    photosCount: 0,
  };
}

function page(data: Graffiti[], current: number, last: number): PaginatedResponse<Graffiti> {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: current, from: 1, last_page: last,
      per_page: GraffitiFeedService.PAGE_SIZE, to: data.length, total: data.length * last,
    },
  };
}

/** Answers one page per call, in order; a `null` entry fails that call. */
class FakeLoadList {
  calls: GraffitiFilters[] = [];
  answers: (PaginatedResponse<Graffiti> | null)[] = [];

  async execute(filters?: GraffitiFilters): Promise<PaginatedResponse<Graffiti>> {
    this.calls.push(filters ?? {});
    const answer = this.answers.shift();
    if (!answer) throw new Error('HTTP 500');
    return answer;
  }
}

describe('GraffitiFeedService', () => {
  let feed: GraffitiFeedService;
  let loadList: FakeLoadList;

  const first = [graffiti('g1'), graffiti('g2')];
  const second = [graffiti('g3'), graffiti('g4')];

  beforeEach(() => {
    loadList = new FakeLoadList();
    TestBed.configureTestingModule({
      providers: [{ provide: LoadGraffitiListUseCase, useValue: loadList }],
    });
    feed = TestBed.inject(GraffitiFeedService);
  });

  it('loads the first page newest first', async () => {
    loadList.answers = [page(first, 1, 3)];

    await feed.loadFirst();

    expect(loadList.calls).toEqual([{ sort: 'latest', page: 1, perPage: GraffitiFeedService.PAGE_SIZE }]);
    expect(feed.items().map((g) => g.id)).toEqual(['g1', 'g2']);
    expect(feed.error()).toBeNull();
  });

  /** Reaching the end asks for page + 1 and appends; nothing already shown moves. */
  it('appends the next page after the current one', async () => {
    loadList.answers = [page(first, 1, 3), page(second, 2, 3)];
    await feed.loadFirst();

    await feed.loadNext();

    expect(loadList.calls[1]).toEqual({ sort: 'latest', page: 2, perPage: GraffitiFeedService.PAGE_SIZE });
    expect(feed.items().map((g) => g.id)).toEqual(['g1', 'g2', 'g3', 'g4']);
  });

  it('never asks for the same page twice while it is in flight', async () => {
    loadList.answers = [page(first, 1, 3), page(second, 2, 3)];
    await feed.loadFirst();

    await Promise.all([feed.loadNext(), feed.loadNext(), feed.loadNext()]);

    expect(loadList.calls.length).toBe(2);
    expect(loadList.calls.map((c) => c.page)).toEqual([1, 2]);
  });

  it('stops asking once the last page is loaded', async () => {
    loadList.answers = [page(first, 1, 1)];
    await feed.loadFirst();

    await feed.loadNext();
    await feed.loadNext();

    expect(loadList.calls.length).toBe(1);
  });

  /**
   * A failed second page is a notice, not a reset: the first page stays on
   * screen and a retry asks for the page that failed, from where the person is.
   */
  it('keeps the loaded artworks when the next page fails, and retries that page', async () => {
    loadList.answers = [page(first, 1, 3), null, page(second, 2, 3)];
    await feed.loadFirst();

    await feed.loadNext();

    expect(feed.error()).toBe('No se pudieron cargar las obras.');
    expect(feed.items().map((g) => g.id)).toEqual(['g1', 'g2']);

    await feed.retry();

    expect(loadList.calls.map((c) => c.page)).toEqual([1, 2, 2]);
    expect(feed.error()).toBeNull();
    expect(feed.items().map((g) => g.id)).toEqual(['g1', 'g2', 'g3', 'g4']);
  });

  it('retries the first page when nothing could be loaded at all', async () => {
    loadList.answers = [null, page(first, 1, 1)];
    await feed.loadFirst();
    expect(feed.items()).toEqual([]);
    expect(feed.error()).not.toBeNull();

    await feed.retry();

    expect(loadList.calls.map((c) => c.page)).toEqual([1, 1]);
    expect(feed.items().map((g) => g.id)).toEqual(['g1', 'g2']);
  });

  it('reports loading only while a request is in flight', async () => {
    loadList.answers = [page(first, 1, 1)];

    const pending = feed.loadFirst();
    expect(feed.loading()).toBeTrue();
    await pending;

    expect(feed.loading()).toBeFalse();
  });
});
