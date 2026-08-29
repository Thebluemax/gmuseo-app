import { inject, Injectable, signal } from '@angular/core';
import { Graffiti } from '../../domain/models/graffiti.model';
import { GraffitiFilters } from '../../domain/models/graffiti-filters.model';
import { PaginatedResponse } from '../../../shared/domain/pagination.model';
import { LoadGraffitiListUseCase } from '../usecases/load-graffiti-list.usecase';

@Injectable({ providedIn: 'root' })
export class GraffitiService {
  private loadListUseCase = inject(LoadGraffitiListUseCase);

  readonly graffitiList = signal<PaginatedResponse<Graffiti> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async fetchList(filters?: GraffitiFilters): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.graffitiList.set(await this.loadListUseCase.execute(filters));
    } catch {
      this.error.set('No se pudo cargar los graffitis.');
    } finally {
      this.loading.set(false);
    }
  }
}
