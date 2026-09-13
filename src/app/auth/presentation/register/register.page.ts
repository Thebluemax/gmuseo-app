import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonInput, IonButton, IonText, IonSpinner, IonNote,
} from '@ionic/angular/standalone';
import { AuthService } from '../../application/auth.service';
import { fieldErrors } from '../validation-errors';

@Component({
  selector: 'gm-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonInput, IonButton, IonText, IonSpinner, IonNote,
    FormsModule, RouterLink,
  ],
})
export class RegisterPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  lastname = '';
  email = '';
  username = '';
  password = '';
  passwordConfirmation = '';

  readonly loading = signal(false);
  readonly errors = signal<Record<string, string[]>>({});
  readonly generalError = signal<string | null>(null);

  fieldError(field: string): string | null {
    return this.errors()[field]?.[0] ?? null;
  }

  async register(): Promise<void> {
    this.loading.set(true);
    this.errors.set({});
    this.generalError.set(null);
    try {
      // register (201, no tokens) → AuthService chains login internally.
      await this.authService.register({
        name: this.name,
        lastname: this.lastname || undefined,
        email: this.email,
        username: this.username,
        password: this.password,
        password_confirmation: this.passwordConfirmation,
      });
      this.router.navigate(['/tabs/catalog']);
    } catch (err) {
      const fe = fieldErrors(err);
      if (Object.keys(fe).length) {
        this.errors.set(fe);
      } else {
        this.generalError.set('No se pudo crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
