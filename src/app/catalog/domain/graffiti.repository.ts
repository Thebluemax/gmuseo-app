import { PaginatedResponse } from '../../shared/domain/pagination.model';
import { Graffiti } from './graffiti.model';

export abstract class GraffitiRepository {
  abstract getList(page?: number): Promise<PaginatedResponse<Graffiti>>;
  abstract getLast(): Promise<Graffiti[]>;
  abstract getById(id: string): Promise<Graffiti>;
}
