import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText,
} from '@ionic/angular/standalone';
import { AuthService } from '../../application/auth.service';

@Component({
  selector: 'gm-profile',
  templateUrl: './profile.page.html',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText],
})
export class ProfilePage {
  readonly authService = inject(AuthService);
  private router = inject(Router);

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/tabs/catalog']);
  }
}
