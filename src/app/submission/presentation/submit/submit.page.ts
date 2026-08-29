import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonItem, IonLabel, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonText, IonSpinner, IonNote, IonTextarea,
  IonToggle, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, locationOutline, closeOutline, arrowBackOutline } from 'ionicons/icons';
import { CameraPort } from '../../domain/ports/camera.port';
import { GeolocationPort } from '../../domain/ports/geolocation.port';
import {
  Artist, CapturedPhoto, Coordinates, GraffitiState, UnauthorizedError,
} from '../../domain/models/submission.model';
import { CreateGraffitiUseCase } from '../../application/create-graffiti.usecase';
import { SubmissionRepository } from '../../domain/submission.repository';
import { CategoryService } from '../../../catalog/application/category.service';
import { AuthService } from '../../../auth/application/auth.service';

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
    IonContent, IonItem, IonLabel, IonSelect, IonSelectOption,
    IonButton, IonIcon, IonText, IonSpinner, IonNote, IonTextarea,
    IonToggle,
    FormsModule, DecimalPipe,
  ],
})
export class SubmitPage implements OnInit {
  private camera = inject(CameraPort);
  private geolocation = inject(GeolocationPort);
  private createGraffiti = inject(CreateGraffitiUseCase);
  private submissionRepo = inject(SubmissionRepository);
  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastController);
  readonly categoryService = inject(CategoryService);

  readonly states = STATES;

  // Everything except the description defaults silently; the user only adds a
  // photo (location is captured automatically) and optionally a description.
  // The advanced toggle reveals category/artist/state for manual override.
  categoryId = '';
  artistId = '';
  state: GraffitiState = 'intact';
  description = '';

  readonly showAdvanced = signal(false);

  readonly photos = signal<CapturedPhoto[]>([]);
  readonly coordinates = signal<Coordinates | null>(null);
  readonly artists = signal<Artist[]>([]);

  readonly locating = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  // Artist is intentionally NOT required: most street art is anonymous, and
  // create() omits artist_id when none is chosen, which is exactly how the API
  // records unknown authorship.
  readonly canSubmit = computed(
    () =>
      this.photos().length > 0 &&
      !!this.coordinates() &&
      !!this.categoryId &&
      !this.submitting()
  );

  constructor() {
    addIcons({ cameraOutline, locationOutline, closeOutline, arrowBackOutline });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadArtists();
    this.locate(); // best-effort GPS on entry
  }

  private async loadCategories(): Promise<void> {
    await this.categoryService.loadList();
    // Default to the first category — the form hides this choice from the user.
    this.categoryId = this.categoryService.categories()[0]?.id ?? '';
  }

  /**
   * The picker is optional and starts empty. Anonymous is the default because
   * it is the majority case, and it means sending no artist at all — there is
   * no anonymous account to look up any more, and picking the first artist in
   * the list would attribute someone else's work by accident.
   */
  private async loadArtists(): Promise<void> {
    try {
      this.artists.set(await this.submissionRepo.listArtists());
    } catch {
      // A catalogue that will not load must not block an upload: the piece is
      // simply filed as anonymous.
      this.artists.set([]);
    }
  }

  back(): void {
    this.router.navigate(['/tabs/catalog']);
  }

  async capture(): Promise<void> {
    this.error.set(null);
    try {
      const captured = await this.camera.capturePhotos();
      this.photos.update((current) => [...current, ...captured]);
      // Refresh GPS on every photo so location always matches the shot.
      await this.locate();
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
      await this.createGraffiti.execute({
        category: this.categoryId,
        artistId: this.artistId || undefined,
        coordinates,
        photos,
        state: this.state,
        description: this.description.trim() || undefined,
      });
      await this.showToast('¡Graffiti subido!');
      this.router.navigate(['/tabs/catalog']);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        // Dead session: tear down auth and send the user to login to re-auth.
        await this.showToast('Tu sesión expiró. Iniciá sesión de nuevo.');
        await this.auth.forceLogout();
        return;
      }
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
