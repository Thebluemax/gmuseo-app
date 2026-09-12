import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton, IonIcon, IonContent, IonSpinner, IonFab, IonFabButton,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, logInOutline, addOutline } from 'ionicons/icons';
import { GraffitiFeedService } from '../../application/services/graffiti-feed.service';
import { AuthService } from '../../../auth/application/auth.service';
import { LoginModalComponent } from '../../../auth/presentation/login-modal/login-modal.component';
import { GraffitiReelsComponent } from '../components/graffiti-reels/graffiti-reels';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'gm-graffiti',
  templateUrl: './graffiti.page.html',
  styleUrls: ['./graffiti.page.scss'],
  imports: [
    IonButton, IonIcon, IonContent, IonSpinner, IonFab, IonFabButton,
    RouterLink,
    GraffitiReelsComponent,
  ],
})
export class GraffitiPage implements OnInit {
  private modalCtrl = inject(ModalController);
  readonly authService = inject(AuthService);
  readonly feed = inject(GraffitiFeedService);

  readonly appName = environment.appName;

  constructor() {
    addIcons({ personCircleOutline, logInOutline, addOutline });
  }

  ngOnInit(): void {
    void this.feed.loadFirst();
  }

  onReachedEnd(): void {
    void this.feed.loadNext();
  }

  onRetry(): void {
    void this.feed.retry();
  }

  async onAppNameClick(): Promise<void> {
    if (this.authService.isAuthenticated()) {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: LoginModalComponent,
      cssClass: 'login-modal-overlay',
      backdropDismiss: true,
    });
    await modal.present();
  }
}
