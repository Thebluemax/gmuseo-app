import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonItem, IonInput, IonButton, IonText, IonSpinner, IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { AuthService } from '../../application/auth.service';
import { ServerConfig } from '../../../shared/application/server-config';

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
  private serverConfig = inject(ServerConfig);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly server = this.serverConfig.apiUrl;
  readonly serverOpen = signal(false);
  serverUrl = '';
  readonly serverLoading = signal(false);
  readonly serverError = signal<string | null>(null);

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

  openServer(): void {
    this.serverUrl = this.server();
    this.serverOpen.set(true);
  }

  async saveServer(): Promise<void> {
    this.serverLoading.set(true);
    this.serverError.set(null);
    try {
      await this.serverConfig.save(this.serverUrl);
      this.serverConfig.restart();
    } catch (err) {
      this.serverError.set(err instanceof Error ? err.message : 'Error al cambiar servidor');
    } finally {
      this.serverLoading.set(false);
    }
  }

  closeServer(): void {
    this.serverOpen.set(false);
  }
}
