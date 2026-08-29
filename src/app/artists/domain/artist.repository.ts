import { Artist } from './artist.model';
import { PaginatedResponse } from '../../shared/domain/pagination.model';

export interface ArtistListFilters {
  page?: number;
  perPage?: number;
}

export abstract class ArtistRepository {
  /** `GET /v1/artists` — paginated, unlike the bare array of `/v1/categories`. */
  abstract getList(filters?: ArtistListFilters): Promise<PaginatedResponse<Artist>>;
  abstract getById(id: string): Promise<Artist>;
}
