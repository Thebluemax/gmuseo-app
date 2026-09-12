import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { GraffitiRepository } from '../../domain/repositories/graffiti.repository';
import { Graffiti, GraffitiDetail } from '../../domain/models/graffiti.model';
import { GraffitiFilters } from '../../domain/models/graffiti-filters.model';
import { PaginatedResponse } from '../../../shared/domain/pagination.model';
import { API_BASE_URL } from '../../../shared/infrastructure/api.config';
import {
  GraffitiDetailDto, GraffitiDto, toGraffiti, toGraffitiDetail,
} from '../adapters/graffiti-api.adapter';

@Injectable()
export class HttpGraffitiRepository extends GraffitiRepository {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);
  private graffitiUrl = `${this.baseUrl}/v1/graffitis`;

  getList(filters: GraffitiFilters = {}): Promise<PaginatedResponse<Graffiti>> {
    return firstValueFrom(
      this.http
        .get<PaginatedResponse<GraffitiDto>>(this.graffitiUrl, {
          params: toParams(filters),
        })
        .pipe(map((res) => ({ ...res, data: res.data.map(toGraffiti) })))
    );
  }

  getById(id: string): Promise<GraffitiDetail> {
    return firstValueFrom(
      this.http
        .get<GraffitiDetailDto>(`${this.graffitiUrl}/${id}`)
        .pipe(map(toGraffitiDetail))
    );
  }
}

function toParams(filters: GraffitiFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.page != null) params['page'] = String(filters.page);
  if (filters.perPage != null) params['per_page'] = String(filters.perPage);
  if (filters.category) params['category'] = filters.category;
  if (filters.artist) params['artist'] = filters.artist;
  if (filters.sort) params['sort'] = filters.sort;
  return params;
}
