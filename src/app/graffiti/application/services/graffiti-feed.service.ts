import { inject, Injectable, signal } from '@angular/core';
import { Graffiti } from '../../domain/models/graffiti.model';
import { LoadGraffitiListUseCase } from '../usecases/load-graffiti-list.usecase';

/**
 * The feed's pages, accumulated. The listing is paginated and the feed is a
 * single vertical run, so pages are appended, never swapped: reaching the last
 * loaded artwork asks for the next page, and a failed page keeps every artwork
 * already on screen and offers a retry from the same place.
 */
@Injectable({ providedIn: 'root' })
export class GraffitiFeedService {
  static readonly PAGE_SIZE = 10;

  private loadList = inject(LoadGraffitiListUseCase);

  readonly items = signal<Graffiti[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private page = 0;
  private lastPage: number | null = null;

  /** First page, from scratch. */
  async loadFirst(): Promise<void> {
    this.page = 0;
    this.lastPage = null;
    await this.loadPage(1);
  }

  /**
   * The page after the last one loaded. A no-op while a request is in flight
   * or once the listing is exhausted, so reaching the end twice — or an end
   * that is also the beginning — never asks for the same page twice.
   */
  async loadNext(): Promise<void> {
    if (this.loading()) return;
    if (this.lastPage !== null && this.page >= this.lastPage) return;
    await this.loadPage(this.page + 1);
  }

  /** After a failure: whatever page was being asked for, from the same spot. */
  async retry(): Promise<void> {
    if (this.page === 0) await this.loadFirst();
    else await this.loadNext();
  }

  private async loadPage(page: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.loadList.execute({
        sort: 'latest', page, perPage: GraffitiFeedService.PAGE_SIZE,
      });
      this.items.update((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
      this.page = page;
      this.lastPage = res.meta.last_page;
    } catch {
      this.error.set('No se pudieron cargar las obras.');
    } finally {
      this.loading.set(false);
    }
  }
}
