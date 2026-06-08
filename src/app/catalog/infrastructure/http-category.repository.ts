import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CategoryRepository } from '../domain/category.repository';
import { Category } from '../domain/category.model';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';

@Injectable()
export class HttpCategoryRepository extends CategoryRepository {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  getList(): Promise<Category[]> {
    return firstValueFrom(
      this.http.get<Category[]>(`${this.baseUrl}/categories`)
    );
  }

  getById(id: string): Promise<Category> {
    return firstValueFrom(
      this.http.get<Category>(`${this.baseUrl}/categories/${id}`)
    );
  }
}
