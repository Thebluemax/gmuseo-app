import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonInput, IonButton, IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../../application/auth.service';
import { ChangeServerUseCase } from '../../application/change-server.use-case';
import { ServerConfig } from '../../../shared/application/server-config';
import { CLEARTEXT_HOSTS } from '../../../shared/domain/cleartext-hosts';
import { isCleartext, ServerUrlError } from '../../../shared/domain/server-url';
import { firstError } from '../validation-errors';

@Component({
  selector: 'gm-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonInput, IonButton, IonText, IonSpinner,
    FormsModule, RouterLink,
  ],
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private changeServer = inject(ChangeServerUseCase);
  private serverConfig = inject(ServerConfig);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // --- server -----------------------------------------------------------------

  /** The API every request goes to, shown so a wrong server is never a mystery. */
  readonly server = this.serverConfig.apiUrl;
  readonly serverIsDefault = this.serverConfig.isDefault;
  readonly serverIsCleartext = computed(() => isCleartext(this.server()));
  readonly cleartextHosts = CLEARTEXT_HOSTS.join(', ');

  readonly serverOpen = signal(false);
  serverUrl = '';
  readonly serverLoading = signal(false);
  readonly serverError = signal<string | null>(null);

  async login() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.login({ email: this.email, password: this.password });
      this.router.navigate(['/tabs/catalog']);
    } catch (err) {
      // 422 carries the server's "credentials are incorrect" message; fall back
      // to a generic message for transport/other errors.
      this.error.set(firstError(err) ?? 'Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  openServer(): void {
    this.serverUrl = this.server();
    this.serverError.set(null);
    this.serverOpen.set(true);
  }

  closeServer(): void {
    this.serverOpen.set(false);
    this.serverError.set(null);
  }

  /** Back to the URL the build shipped with. Same checks as any other server. */
  useDefaultServer(): Promise<void> {
    return this.saveServer(this.serverConfig.defaultApiUrl);
  }

  saveServer(url = this.serverUrl): Promise<void> {
    return this.runServerChange(url);
  }

  private async runServerChange(url: string): Promise<void> {
    this.serverLoading.set(true);
    this.serverError.set(null);
    try {
      // On success the use case restarts the app; nothing left to do here.
      await this.changeServer.execute(url);
      this.serverOpen.set(false);
    } catch (err) {
      this.serverError.set(
        err instanceof ServerUrlError ? err.message : 'No se ha podido cambiar de servidor.'
      );
    } finally {
      this.serverLoading.set(false);
    }
  }
}
