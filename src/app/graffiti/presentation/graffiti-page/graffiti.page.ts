import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton, IonIcon, IonContent, IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { LoadGraffitiListUseCase } from '../../application/usecases/load-graffiti-list.usecase';
import { AuthService } from '../../../auth/application/auth.service';
import { LoginModalComponent } from '../../../auth/presentation/login-modal/login-modal.component';
import { GraffitiReels } from '../components/graffiti-reels/graffiti-reels';
import type { Graffiti } from '../../domain/models/graffiti.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'gm-graffiti',
  templateUrl: './graffiti.page.html',
  styleUrls: ['./graffiti.page.scss'],
  imports: [
    IonButton, IonIcon, IonContent, IonSpinner,
    RouterLink,
    GraffitiReels,
  ],
})
export class GraffitiPage implements OnInit {
  private loadListUseCase = inject(LoadGraffitiListUseCase);
  private modalCtrl = inject(ModalController);
  readonly authService = inject(AuthService);

  readonly appName = environment.appName;
  readonly graffitis = signal<Graffiti[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.fetchLatest();
  }

  async onAppNameClick(): Promise<void> {
    if (this.authService.isLoggedIn()) {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: LoginModalComponent,
      cssClass: 'login-modal-overlay',
      backdropDismiss: true,
    });
    await modal.present();
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
