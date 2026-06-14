import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
  IonItem, IonLabel, IonSelect, IonSelectOption, IonButton, IonIcon,
  IonText, IonSpinner, IonNote, IonTextarea, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, locationOutline, closeOutline } from 'ionicons/icons';
import { CameraPort } from '../../domain/ports/camera.port';
import { GeolocationPort } from '../../domain/ports/geolocation.port';
import {
  Artist, CapturedPhoto, Coordinates, GraffitiState,
} from '../../domain/models/submission.model';
import { CreateGraffitiUseCase } from '../../application/create-graffiti.usecase';
import { SubmissionRepository } from '../../domain/submission.repository';
import { CategoryService } from '../../../catalog/application/category.service';

const STATES: { value: GraffitiState; label: string }[] = [
  { value: 'intact', label: 'Intacto' },
  { value: 'damaged', label: 'Dañado' },
  { value: 'painted_over', label: 'Tapado' },
  { value: 'removed', label: 'Eliminado' },
];

@Component({
  selector: 'gm-submit',
  templateUrl: './submit.page.html',
  styleUrls: ['./submit.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
    IonItem, IonLabel, IonSelect, IonSelectOption, IonButton, IonIcon,
    IonText, IonSpinner, IonNote, IonTextarea,
    FormsModule, DecimalPipe,
  ],
})
export class SubmitPage implements OnInit {
  private camera = inject(CameraPort);
  private geolocation = inject(GeolocationPort);
  private createGraffiti = inject(CreateGraffitiUseCase);
  private submissionRepo = inject(SubmissionRepository);
  private router = inject(Router);
  private toast = inject(ToastController);
  readonly categoryService = inject(CategoryService);

  readonly states = STATES;

  categoryId = '';
  artistId = '';
  state: GraffitiState = 'intact';
  description = '';

  readonly photos = signal<CapturedPhoto[]>([]);
  readonly coordinates = signal<Coordinates | null>(null);
  readonly artists = signal<Artist[]>([]);

  readonly locating = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly canSubmit = computed(
    () =>
      this.photos().length > 0 &&
      !!this.coordinates() &&
      !!this.categoryId &&
      !!this.artistId &&
      !this.submitting()
  );

  constructor() {
    addIcons({ cameraOutline, locationOutline, closeOutline });
  }

  ngOnInit(): void {
    this.categoryService.loadList();
    this.loadArtists();
    this.locate(); // best-effort GPS on entry
  }

  private async loadArtists(): Promise<void> {
    try {
      const artists = await this.submissionRepo.listArtists();
      this.artists.set(artists);
      // Default to the "Anonymous" artist for crowd submissions when present.
      const anon = artists.find((a) => /anon/i.test(a.name));
      this.artistId = anon?.id ?? artists[0]?.id ?? '';
    } catch {
      this.error.set('No se pudo cargar la lista de artistas.');
    }
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
    if (photos.length === 0 || !coordinates || !this.categoryId || !this.artistId) return;

    this.submitting.set(true);
    this.error.set(null);
    try {
      await this.createGraffiti.execute({
        category: this.categoryId,
        artistId: this.artistId,
        coordinates,
        photos,
        state: this.state,
        description: this.description.trim() || undefined,
      });
      await this.showToast('¡Graffiti subido!');
      this.router.navigate(['/tabs/catalog']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo crear el graffiti.');
    } finally {
      this.submitting.set(false);
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toast.create({ message, color: 'success', duration: 2500 });
    await toast.present();
  }
}
