import { inject, Injectable, signal } from '@angular/core';
import { CategoryRepository } from '../domain/category.repository';
import { Category } from '../domain/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private repo = inject(CategoryRepository);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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
}
