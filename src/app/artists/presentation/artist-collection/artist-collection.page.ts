import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonSpinner,
} from '@ionic/angular/standalone';
import { ArtistService } from '../../application/artist.service';
import { LoadGraffitiListUseCase } from '../../../graffiti/application/usecases/load-graffiti-list.usecase';
import { GraffitiCardComponent } from '../../../graffiti/presentation/components/graffiti-card/graffiti-card';
import type { Graffiti } from '../../../graffiti/domain/models/graffiti.model';

/**
 * Everything attributed to one artist. The listing is filtered server-side with
 * `GET /v1/graffitis?artist=<uuid>`; an artist with no work is a legitimate
 * catalogue entry, not an error, so it gets its own message rather than a
 * failure state.
 */
@Component({
  selector: 'gm-artist-collection',
  templateUrl: './artist-collection.page.html',
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonSpinner,
    GraffitiCardComponent,
  ],
})
export class ArtistCollectionPage implements OnInit {
  private route = inject(ActivatedRoute);
  private loadGraffitis = inject(LoadGraffitiListUseCase);
  readonly artistService = inject(ArtistService);

  readonly graffitis = signal<Graffiti[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Artista no encontrado.');

      return;
    }
    await this.load(id);
  }

  private async load(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.artistService.loadOne(id);
      const page = await this.loadGraffitis.execute({ artist: id, perPage: 30 });
      this.graffitis.set(page.data);
    } catch {
      this.error.set('No se pudo cargar la obra del artista.');
    } finally {
      this.loading.set(false);
    }
  }
}
