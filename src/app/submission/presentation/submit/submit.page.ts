import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonItem, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonText, IonSpinner, IonNote,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, locationOutline, closeOutline, arrowBackOutline } from 'ionicons/icons';
import { CameraPort } from '../../domain/ports/camera.port';
import { GeolocationPort } from '../../domain/ports/geolocation.port';
import {
  CapturedPhoto, Coordinates, LocationError, LocationFailure, UnauthorizedError,
  UPLOAD_LIMITS, ValidationError,
} from '../../domain/models/submission.model';
import { CreateGraffitiUseCase } from '../../application/create-graffiti.usecase';
import { CategoryService } from '../../../catalog/application/category.service';
import { AuthService } from '../../../auth/application/auth.service';

/**
 * What each location failure means for the person, and what fixes it. Three
 * cases, three actions: grant the permission, switch location on, or wait and
 * try again.
 */
const LOCATION_MESSAGES: Record<LocationFailure, string> = {
  permission_denied:
    'La ubicación es necesaria para publicar. El permiso está denegado: concedelo en los ajustes del dispositivo y reintentá.',
  unavailable:
    'La ubicación del dispositivo está desactivada. Activala y reintentá.',
  timeout:
    'No se pudo fijar la posición a tiempo. Reintentá.',
};

/**
 * The prototype's form: photos and a category. Coordinates come from the
 * device without being asked for; artist, state and description exist in the
 * API but not here. Sending is disabled until the three things are in, and the
 * form says which one is missing instead of leaving a dead button.
 */
@Component({
  selector: 'gm-submit',
  templateUrl: './submit.page.html',
  styleUrls: ['./submit.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonItem, IonSelect, IonSelectOption,
    IonButton, IonIcon, IonText, IonSpinner, IonNote,
    FormsModule,
  ],
})
export class SubmitPage implements OnInit {
  private camera = inject(CameraPort);
  private geolocation = inject(GeolocationPort);
  private createGraffiti = inject(CreateGraffitiUseCase);
  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastController);
  readonly categoryService = inject(CategoryService);

  readonly limits = UPLOAD_LIMITS;

  readonly categoryId = signal('');
  readonly photos = signal<CapturedPhoto[]>([]);
  readonly coordinates = signal<Coordinates | null>(null);

  readonly locating = signal(false);
  readonly submitting = signal(false);
  /**
   * Where the send is. A real upload is tens of seconds of sending and tens
   * of processing; the person must be able to tell one from the other, and
   * both from a hang.
   */
  readonly phase = signal<'idle' | 'uploading' | 'waiting'>('idle');
  /** Percent of the body sent, once the transport has said so; null until then. */
  readonly percent = signal<number | null>(null);
  readonly sendingLabel = computed(() => {
    if (this.phase() === 'waiting') return 'Procesando en el servidor…';
    const percent = this.percent();
    return percent === null ? 'Subiendo fotos…' : `Subiendo fotos… ${percent} %`;
  });

  /** Why the device gave no position, until it does. */
  readonly locationFailure = signal<LocationFailure | null>(null);
  readonly locationMessage = computed(() => {
    const failure = this.locationFailure();
    return failure ? LOCATION_MESSAGES[failure] : null;
  });

  /** A problem with the photos chosen: too many, too big, or refused by the server. */
  readonly photosError = signal<string | null>(null);
  /** Anything else that stopped the upload. */
  readonly error = signal<string | null>(null);

  /** What still has to be in before sending, in the order the form shows it. */
  readonly missing = computed(() => {
    const missing: string[] = [];
    if (this.photos().length === 0) missing.push('al menos una foto');
    if (!this.categoryId()) missing.push('la categoría');
    if (!this.coordinates()) missing.push('la ubicación');
    return missing;
  });

  readonly canSubmit = computed(() => this.missing().length === 0 && !this.submitting());

  constructor() {
    addIcons({ cameraOutline, locationOutline, closeOutline, arrowBackOutline });
  }

  ngOnInit(): void {
    void this.loadCategories();
    void this.locate();
  }

  /**
   * The category is chosen, not defaulted: a first-in-the-list default would
   * file every piece under whatever category happens to sort first.
   */
  async loadCategories(): Promise<void> {
    await this.categoryService.loadList();
  }

  back(): void {
    this.router.navigate(['/tabs/catalog']);
  }

  async capture(): Promise<void> {
    this.photosError.set(null);
    this.error.set(null);
    let captured: CapturedPhoto[];
    try {
      captured = await this.camera.capturePhotos();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo capturar la foto.');
      return;
    }
    this.addPhotos(captured);
    // Refresh GPS on every photo so location always matches the shot.
    await this.locate();
  }

  /**
   * Stops at the upload limits before anything is sent: a file over the size
   * cap is dropped and named, and photos past the count cap are not added. The
   * ones that fit stay selected either way.
   */
  private addPhotos(captured: CapturedPhoto[]): void {
    const { maxFiles, maxBytesPerFile } = UPLOAD_LIMITS;
    const problems: string[] = [];

    const sized = captured.filter((p) => p.blob.size <= maxBytesPerFile);
    const tooBig = captured.length - sized.length;
    if (tooBig > 0) {
      problems.push(
        `${tooBig === 1 ? 'Una foto supera' : `${tooBig} fotos superan`} el máximo de ${formatMb(maxBytesPerFile)} por foto y no se añadió${tooBig === 1 ? '' : 'eron'}.`
      );
    }

    const room = Math.max(0, maxFiles - this.photos().length);
    const kept = sized.slice(0, room);
    if (sized.length > room) {
      problems.push(
        `Caben ${maxFiles} fotos como máximo: ya hay ${this.photos().length} elegida${this.photos().length === 1 ? '' : 's'} y se añadieron ${kept.length} de ${sized.length}.`
      );
    }

    sized.slice(room).concat(captured.filter((p) => p.blob.size > maxBytesPerFile))
      .forEach((p) => URL.revokeObjectURL(p.previewUrl));
    if (kept.length > 0) this.photos.update((current) => [...current, ...kept]);
    if (problems.length > 0) this.photosError.set(problems.join(' '));
  }

  removePhoto(index: number): void {
    this.photosError.set(null);
    this.photos.update((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((_, i) => i !== index);
    });
  }

  /** Ask the device again. Photos and category stay exactly as chosen. */
  async locate(): Promise<void> {
    this.locating.set(true);
    this.locationFailure.set(null);
    try {
      this.coordinates.set(await this.geolocation.getCurrentPosition());
    } catch (err) {
      this.coordinates.set(null);
      this.locationFailure.set(err instanceof LocationError ? err.reason : 'unavailable');
    } finally {
      this.locating.set(false);
    }
  }

  async submit(): Promise<void> {
    const coordinates = this.coordinates();
    if (!this.canSubmit() || !coordinates) return;

    this.submitting.set(true);
    this.phase.set('uploading');
    this.percent.set(null);
    this.error.set(null);
    this.photosError.set(null);
    try {
      const id = await this.createGraffiti.execute(
        {
          category: this.categoryId(),
          coordinates,
          photos: this.photos(),
        },
        ({ sent, total }) => {
          if (sent >= total) {
            this.phase.set('waiting');
          } else {
            this.percent.set(Math.floor((100 * sent) / total));
          }
        },
      );
      // The confirmation is the feed itself: it reloads with the new piece
      // first and says so there, once it is on screen (see GraffitiPage).
      this.router.navigate(['/tabs/catalog'], { state: { createdId: id } });
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        // Dead session: tear down auth and send the user to login to re-auth.
        await this.showToast('Tu sesión expiró. Iniciá sesión de nuevo.');
        await this.auth.forceLogout();
        return;
      }
      // The selection stays: the server said what is wrong with it, and the
      // person corrects that, not the whole form.
      if (err instanceof ValidationError) {
        this.photosError.set(err.message);
        return;
      }
      this.error.set(err instanceof Error ? err.message : 'No se pudo crear el graffiti.');
    } finally {
      this.submitting.set(false);
      this.phase.set('idle');
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toast.create({ message, color: 'success', duration: 2500 });
    await toast.present();
  }
}

function formatMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
