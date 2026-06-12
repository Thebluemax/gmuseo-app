import { inject, Injectable } from '@angular/core';
import { GraffitiRepository } from '../../domain/repositories/graffiti.repository';
import { PaginatedResponse } from '../../../shared/domain/pagination.model';
import { Graffiti } from '../../domain/models/graffiti.model';
import { GraffitiFilters } from '../../domain/models/graffiti-filters.model';

@Injectable({ providedIn: 'root' })
export class LoadGraffitiListUseCase {
  private repo = inject(GraffitiRepository);

  execute(filters?: GraffitiFilters): Promise<PaginatedResponse<Graffiti>> {
    return this.repo.getList(filters);
  }
}
