import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { ArtistListFilters, ArtistRepository } from '../domain/artist.repository';
import { Artist } from '../domain/artist.model';
import { PaginatedResponse } from '../../shared/domain/pagination.model';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';

interface ArtistDto {
  id: string;
  name: string;
  bio: string | null;
  instagram: string | null;
  website: string | null;
  graffiti_count: number;
}

@Injectable()
export class HttpArtistRepository extends ArtistRepository {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);
  private artistUrl = `${this.baseUrl}/v1/artists`;

  getList(filters: ArtistListFilters = {}): Promise<PaginatedResponse<Artist>> {
    return firstValueFrom(
      this.http
        .get<PaginatedResponse<ArtistDto>>(this.artistUrl, { params: toParams(filters) })
        .pipe(map((res) => ({ ...res, data: res.data.map(toArtist) })))
    );
  }

  getById(id: string): Promise<Artist> {
    return firstValueFrom(
      this.http
        .get<{ data: ArtistDto }>(`${this.artistUrl}/${id}`)
        .pipe(map((res) => toArtist(res.data)))
    );
  }
}

function toParams(filters: ArtistListFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.page != null) params['page'] = String(filters.page);
  if (filters.perPage != null) params['per_page'] = String(filters.perPage);
  return params;
}

/**
 * Maps exactly the six published fields. An artist is not a user, so nothing
 * account-shaped is read even if the payload ever carried it.
 */
function toArtist(dto: ArtistDto): Artist {
  return {
    id: dto.id,
    name: dto.name,
    bio: dto.bio,
    instagram: dto.instagram,
    website: dto.website,
    graffitiCount: dto.graffiti_count ?? 0,
  };
}
