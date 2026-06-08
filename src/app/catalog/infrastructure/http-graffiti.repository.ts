import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GraffitiRepository } from '../domain/graffiti.repository';
import { Graffiti } from '../domain/graffiti.model';
import { PaginatedResponse } from '../../shared/domain/pagination.model';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';

@Injectable()
export class HttpGraffitiRepository extends GraffitiRepository {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  getList(page = 1): Promise<PaginatedResponse<Graffiti>> {
    return firstValueFrom(
      this.http.get<PaginatedResponse<Graffiti>>(`${this.baseUrl}/graffitis`, {
        params: { page: page.toString() },
      })
    );
  }

  getLast(): Promise<Graffiti[]> {
    return firstValueFrom(
      this.http.get<Graffiti[]>(`${this.baseUrl}/graffitis/last`)
    );
  }

  getById(id: string): Promise<Graffiti> {
    return firstValueFrom(
      this.http.get<Graffiti>(`${this.baseUrl}/graffitis/${id}`)
    );
  }
}
