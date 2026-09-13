import { inject, Injectable, signal } from '@angular/core';
import { CategoryRepository } from '../domain/category.repository';
import { Category } from '../domain/category.model';

/** Bundled stand-in used when a category has no graffiti to borrow a cover from. */
export const CATEGORY_COVER_FALLBACK = 'assets/category-cover-fallback.svg';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private repo = inject(CategoryRepository);

  readonly categories = signal<Category[]>([]);
  readonly selected = signal<Category | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Cover URL per category id. Absent while the cover is still resolving. */
  readonly covers = signal<Record<string, string>>({});

  async loadList(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.repo.getList();
      this.categories.set(data);
    } catch {
      this.error.set('No se pudo cargar las categorías.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadOne(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.selected.set(null);
    try {
      this.selected.set(await this.repo.getById(id));
    } catch {
      this.error.set('No se pudo cargar la categoría.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Resolves one cover per category in parallel. Deliberately not awaited by
   * the pages: the grid renders on the category list alone and each cell fills
   * in as its cover lands. A category with no graffiti, or a request that
   * fails, settles on the bundled fallback rather than staying undefined.
   */
  loadCovers(categories: Category[]): Promise<void[]> {
    return Promise.all(categories.map((category) => this.loadCover(category.id)));
  }

  private async loadCover(categoryId: string): Promise<void> {
    let url: string | null = null;
    try {
      url = await this.repo.getCoverImage(categoryId);
    } catch {
      url = null;
    }
    this.covers.update((current) => ({
      ...current,
      [categoryId]: url ?? CATEGORY_COVER_FALLBACK,
    }));
  }

  /** Cover for a category, falling back to the bundled image until one lands. */
  coverFor(categoryId: string): string {
    return this.covers()[categoryId] ?? CATEGORY_COVER_FALLBACK;
  }
}
