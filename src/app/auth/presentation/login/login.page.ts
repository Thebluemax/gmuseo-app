import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonInput, IonButton, IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../../application/auth.service';
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

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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
}
