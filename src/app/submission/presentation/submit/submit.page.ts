import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
  IonItem, IonLabel, IonSelect, IonSelectOption, IonButton, IonIcon,
  IonText, IonSpinner, IonNote, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, locationOutline, closeOutline } from 'ionicons/icons';
import { CameraPort } from '../../domain/ports/camera.port';
import { GeolocationPort } from '../../domain/ports/geolocation.port';
import { CapturedPhoto, Coordinates } from '../../domain/models/submission.model';
import { CreateGraffitiUseCase } from '../../application/create-graffiti.usecase';
import { CategoryService } from '../../../catalog/application/category.service';

@Component({
  selector: 'gm-submit',
  templateUrl: './submit.page.html',
  styleUrls: ['./submit.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
    IonItem, IonLabel, IonSelect, IonSelectOption, IonButton, IonIcon,
    IonText, IonSpinner, IonNote,
    FormsModule, DecimalPipe,
  ],
})
export class SubmitPage implements OnInit {
  private camera = inject(CameraPort);
  private geolocation = inject(GeolocationPort);
  private createGraffiti = inject(CreateGraffitiUseCase);
  private router = inject(Router);
  private toast = inject(ToastController);
  readonly categoryService = inject(CategoryService);

  categoryId = '';
  readonly photos = signal<CapturedPhoto[]>([]);
  readonly coordinates = signal<Coordinates | null>(null);

  readonly locating = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly canSubmit = computed(
    () =>
      this.photos().length > 0 &&
      !!this.coordinates() &&
      !!this.categoryId &&
      !this.submitting()
  );

  constructor() {
    addIcons({ cameraOutline, locationOutline, closeOutline });
  }

  ngOnInit(): void {
    this.categoryService.loadList();
    this.locate(); // best-effort GPS on entry
  }

  async capture(): Promise<void> {
    this.error.set(null);
    try {
      const captured = await this.camera.capturePhotos();
      this.photos.update((current) => [...current, ...captured]);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo capturar la foto.');
    }
  }

  removePhoto(index: number): void {
    this.photos.update((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((_, i) => i !== index);
    });
  }

  async locate(): Promise<void> {
    this.locating.set(true);
    try {
      this.coordinates.set(await this.geolocation.getCurrentPosition());
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo obtener la ubicación.');
    } finally {
      this.locating.set(false);
    }
  }

  async submit(): Promise<void> {
    const photos = this.photos();
    const coordinates = this.coordinates();
    if (photos.length === 0 || !coordinates || !this.categoryId) return;

    this.submitting.set(true);
    this.error.set(null);
    try {
      const result = await this.createGraffiti.execute({
        category: this.categoryId,
        coordinates,
        photos,
      });
      await this.showToast(
        result.uploaded
          ? '¡Graffiti subido!'
          : 'Graffiti creado, pero la foto no se pudo subir.',
        result.uploaded ? 'success' : 'warning'
      );
      this.router.navigate(['/tabs/catalog']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo crear el graffiti.');
    } finally {
      this.submitting.set(false);
    }
  }

  private async showToast(message: string, color: 'success' | 'warning'): Promise<void> {
    const toast = await this.toast.create({ message, color, duration: 2500 });
    await toast.present();
  }
}
