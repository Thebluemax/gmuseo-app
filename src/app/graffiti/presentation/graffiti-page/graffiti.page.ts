import { Component, inject, OnInit, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton, IonIcon, IonContent, IonSpinner, IonFab, IonFabButton,
  ModalController, ToastController, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, logInOutline, addOutline } from 'ionicons/icons';
import { GraffitiFeedService } from '../../application/services/graffiti-feed.service';
import { AuthService } from '../../../auth/application/auth.service';
import { LoginModalComponent } from '../../../auth/presentation/login-modal/login-modal.component';
import { GraffitiReelsComponent } from '../components/graffiti-reels/graffiti-reels';
import { environment } from 'src/environments/environment';

/** What the submit page leaves in the navigation state after a successful alta. */
interface CatalogState {
  createdId?: string;
}

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
export class GraffitiPage implements OnInit, ViewWillEnter {
  private modalCtrl = inject(ModalController);
  private toast = inject(ToastController);
  private reels = viewChild(GraffitiReelsComponent);
  readonly authService = inject(AuthService);
  readonly feed = inject(GraffitiFeedService);

  readonly appName = environment.appName;

  constructor() {
    addIcons({ personCircleOutline, logInOutline, addOutline });
  }

  ngOnInit(): void {
    void this.feed.loadFirst();
  }

  /**
   * Ionic keeps this page alive across routes, so `ngOnInit` runs once.
   * Coming back from an alta means the listing changed: reload from the top,
   * where the new piece is, and only then say it was published — a notice on
   * top of a feed still loading is what went unseen the first time.
   */
  async ionViewWillEnter(): Promise<void> {
    const state = (history.state ?? {}) as CatalogState;
    if (!state.createdId) return;
    // Consumed: entering again (tab switch, back) must not repeat the notice.
    history.replaceState({ ...state, createdId: undefined }, '');

    await this.feed.loadFirst();
    this.reels()?.showFirst();
    const toast = await this.toast.create({ message: '¡Graffiti publicado!', color: 'success', duration: 4000 });
    await toast.present();
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
