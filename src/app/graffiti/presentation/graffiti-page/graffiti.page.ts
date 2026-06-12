import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton, IonIcon, IonContent, IonSpinner, IonText,
} from '@ionic/angular/standalone';
import { LoadGraffitiListUseCase } from '../../application/usecases/load-graffiti-list.usecase';
import { AuthService } from '../../../auth/application/auth.service';
import { GraffitiReels } from '../components/graffiti-reels/graffiti-reels';
import type { Graffiti } from '../../domain/models/graffiti.model';

@Component({
  selector: 'gm-graffiti',
  templateUrl: './graffiti.page.html',
  styleUrls: ['./graffiti.page.scss'],
  imports: [
    IonButton, IonIcon, IonContent, IonSpinner, IonText,
    RouterLink,
    GraffitiReels,
  ],
})
export class GraffitiPage implements OnInit {
  private loadListUseCase = inject(LoadGraffitiListUseCase);
  readonly authService = inject(AuthService);

  readonly graffitis = signal<Graffiti[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.fetchLatest();
  }

  private async fetchLatest(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.loadListUseCase.execute({ sort: 'latest', perPage: 4 });
      this.graffitis.set(res.data);
    } catch {
      this.error.set('No se pudo cargar los graffitis.');
    } finally {
      this.loading.set(false);
    }
  }
}
