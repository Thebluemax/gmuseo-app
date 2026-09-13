import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonItem, IonInput, IonButton, IonText, IonSpinner, IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { AuthService } from '../../application/auth.service';

@Component({
  selector: 'gm-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonItem, IonInput, IonButton, IonText, IonSpinner, IonIcon,
    FormsModule,
  ],
})
export class LoginModalComponent {
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    addIcons({ closeOutline });
  }

  async login(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.login({ email: this.email, password: this.password });
      await this.modalCtrl.dismiss(true, 'success');
    } catch {
      this.error.set('Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
