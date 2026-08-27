import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { CategoryRepository } from '../domain/category.repository';
import { Category } from '../domain/category.model';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';
import { GraffitiRepository } from '../../graffiti/domain/repositories/graffiti.repository';
import { Graffiti } from '../../graffiti/domain/models/graffiti.model';

@Injectable()
export class HttpCategoryRepository extends CategoryRepository {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);
  private graffitis = inject(GraffitiRepository);

  getList(): Promise<Category[]> {
    return firstValueFrom(
      this.http
        .get<Category[] | { data: Category[] }>(`${this.baseUrl}/v1/categories`)
        .pipe(map((res) => (Array.isArray(res) ? res : res.data)))
    );
  }

  getById(id: string): Promise<Category> {
    return firstValueFrom(
      this.http
        .get<Category | { data: Category }>(`${this.baseUrl}/v1/categories/${id}`)
        .pipe(map((res) => ('data' in res ? res.data : res)))
    );
  }

  async getCoverImage(categoryId: string): Promise<string | null> {
    const page = await this.graffitis.getList({ category: categoryId, perPage: 1 });

    const graffiti = page.data[0];

    return graffiti ? gridPhoto(graffiti) : null;
  }
}

/**
 * Grid cells are small, so the `sm` variant is the right one. `cover` is the
 * `md` variant and only stands in when a graffiti carries no sighting photos.
 */
function gridPhoto(graffiti: Graffiti): string | null {
  for (const sighting of graffiti.sightings) {
    const photo = sighting.photos[0];
    if (photo) return photo.files.sm;
  }

  return graffiti.cover || null;
}
