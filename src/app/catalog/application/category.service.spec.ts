import { TestBed } from '@angular/core/testing';

import { CATEGORY_COVER_FALLBACK, CategoryService } from './category.service';
import { CategoryRepository } from '../domain/category.repository';
import { Category } from '../domain/category.model';

const CATEGORIES: Category[] = [
  { id: 'a20c46cf-57f4-4c1d-b358-df1c0c34e986', name: 'Tag', description: 'One colour.' },
  { id: 'a20c46cf-5866-43d8-831f-c1a3d2559d5f', name: 'Throw-up', description: 'Bubble.' },
];

class CategoryRepositoryDouble extends CategoryRepository {
  list: Category[] = CATEGORIES;
  failure: unknown = null;
  calls = 0;

  override async getList(): Promise<Category[]> {
    this.calls += 1;
    if (this.failure) throw this.failure;

    return this.list;
  }

  override async getById(id: string): Promise<Category> {
    if (this.failure) throw this.failure;

    return this.list.filter((c) => c.id === id)[0];
  }

  covers: Record<string, string | null> = {};
  coverFailure: unknown = null;

  override async getCoverImage(categoryId: string): Promise<string | null> {
    if (this.coverFailure) throw this.coverFailure;

    return this.covers[categoryId] ?? null;
  }
}

describe('CategoryService', () => {
  let service: CategoryService;
  let repo: CategoryRepositoryDouble;

  beforeEach(() => {
    repo = new CategoryRepositoryDouble();
    TestBed.configureTestingModule({
      providers: [{ provide: CategoryRepository, useValue: repo }],
    });
    service = TestBed.inject(CategoryService);
  });

  it('starts empty and not loading', () => {
    expect(service.categories()).toEqual([]);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('publishes the list the repository returns', async () => {
    await service.loadList();

    expect(repo.calls).toBe(1);
    expect(service.categories()).toEqual(CATEGORIES);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('surfaces an error and clears loading when the repository fails', async () => {
    repo.failure = new Error('network down');

    await service.loadList();

    expect(service.error()).toBeTruthy();
    expect(service.loading()).toBe(false);
    expect(service.categories()).toEqual([]);
  });

  it('clears a previous error on a successful reload', async () => {
    repo.failure = new Error('network down');
    await service.loadList();
    expect(service.error()).toBeTruthy();

    repo.failure = null;
    await service.loadList();

    expect(service.error()).toBeNull();
    expect(service.categories()).toEqual(CATEGORIES);
  });

  describe('covers', () => {
    const [tag, throwUp] = CATEGORIES;

    it('reports the fallback before any cover has resolved', () => {
      expect(service.coverFor(tag.id)).toBe(CATEGORY_COVER_FALLBACK);
    });

    it('publishes the cover the repository resolves', async () => {
      repo.covers = { [tag.id]: 'https://media/photo_350.jpg' };

      await service.loadCovers([tag]);

      expect(service.coverFor(tag.id)).toBe('https://media/photo_350.jpg');
    });

    it('settles a category with no graffiti on the bundled fallback', async () => {
      repo.covers = {};

      await service.loadCovers([throwUp]);

      expect(service.covers()[throwUp.id]).toBe(CATEGORY_COVER_FALLBACK);
      expect(service.coverFor(throwUp.id)).toBe(CATEGORY_COVER_FALLBACK);
    });

    it('settles on the fallback when the cover request fails', async () => {
      repo.coverFailure = new Error('network down');

      await service.loadCovers([tag]);

      expect(service.coverFor(tag.id)).toBe(CATEGORY_COVER_FALLBACK);
    });

    it('leaves no category without a resolved cover', async () => {
      repo.covers = { [tag.id]: 'https://media/photo_350.jpg' };

      await service.loadCovers(CATEGORIES);

      for (const category of CATEGORIES) {
        expect(service.covers()[category.id]).toBeDefined();
      }
    });
  });
});
