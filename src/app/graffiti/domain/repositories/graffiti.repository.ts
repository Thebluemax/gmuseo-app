import { PaginatedResponse } from '../../../shared/domain/pagination.model';
import { Graffiti } from '../models/graffiti.model';
import { GraffitiFilters } from '../models/graffiti-filters.model';

export abstract class GraffitiRepository {
  abstract getList(filters?: GraffitiFilters): Promise<PaginatedResponse<Graffiti>>;
  abstract getById(id: string): Promise<Graffiti>;
}
