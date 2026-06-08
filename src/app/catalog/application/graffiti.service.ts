import { inject, Injectable, signal } from '@angular/core';
import { GraffitiRepository } from '../domain/graffiti.repository';
import { Graffiti } from '../domain/graffiti.model';
import { PaginatedResponse } from '../../shared/domain/pagination.model';

@Injectable({ providedIn: 'root' })
export class GraffitiService {
  private repo = inject(GraffitiRepository);

  readonly lastGraffitis = signal<Graffiti[]>([]);
  readonly graffitiList = signal<PaginatedResponse<Graffiti> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadLast(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.repo.getLast();
      this.lastGraffitis.set(data);
    } catch {
      this.error.set('No se pudo cargar los graffitis.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadList(page = 1): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.repo.getList(page);
      this.graffitiList.set(data);
    } catch {
      this.error.set('No se pudo cargar los graffitis.');
    } finally {
      this.loading.set(false);
    }
  }
}
