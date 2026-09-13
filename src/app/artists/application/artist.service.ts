import { inject, Injectable, signal } from '@angular/core';
import { ArtistRepository } from '../domain/artist.repository';
import { Artist } from '../domain/artist.model';

@Injectable({ providedIn: 'root' })
export class ArtistService {
  private repo = inject(ArtistRepository);

  readonly artists = signal<Artist[]>([]);
  readonly selected = signal<Artist | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadList(page = 1): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.repo.getList({ page });
      this.artists.set(result.data);
    } catch {
      this.error.set('No se pudo cargar los artistas.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadOne(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.selected.set(null);
    try {
      this.selected.set(await this.repo.getById(id));
    } catch {
      this.error.set('No se pudo cargar el artista.');
    } finally {
      this.loading.set(false);
    }
  }
}
