import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';

import { SubmitPage } from './submit.page';
import { CameraPort } from '../../domain/ports/camera.port';
import { GeolocationPort } from '../../domain/ports/geolocation.port';
import { SubmissionRepository } from '../../domain/submission.repository';
import {
  Artist, CapturedPhoto, Coordinates, LocationError, LocationFailure, NewGraffiti,
  UPLOAD_LIMITS, ValidationError,
} from '../../domain/models/submission.model';
import { CategoryRepository } from '../../../catalog/domain/category.repository';
import { Category } from '../../../catalog/domain/category.model';
import { AuthService } from '../../../auth/application/auth.service';

const CATEGORIES: Category[] = [
  { id: 'a20c46cf-596c-4481-a214-ec3f025b83a8', name: 'Muralismo', description: '' },
  { id: 'a20c46cf-6b0e-4c2a-9a1d-1f2e3d4c5b6a', name: 'Stencil', description: '' },
];

const HERE: Coordinates = { latitude: 41.38745, longitude: 2.16862 };

function photo(n: number, bytes = 1024): CapturedPhoto {
  return {
    blob: new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }),
    previewUrl: `blob:test/photo-${n}`,
    fileName: `photo-${n}.jpg`,
  };
}

/** Hands over whatever the test queued, one call at a time. */
class FakeCamera extends CameraPort {
  queue: CapturedPhoto[][] = [];

  capturePhotos(): Promise<CapturedPhoto[]> {
    return Promise.resolve(this.queue.shift() ?? []);
  }
}

/** Answers with a position or with the failure the test set, per call. */
class FakeGeolocation extends GeolocationPort {
  failure: LocationFailure | null = null;
  calls = 0;

  getCurrentPosition(): Promise<Coordinates> {
    this.calls++;
    if (this.failure) return Promise.reject(new LocationError(this.failure));
    return Promise.resolve(HERE);
  }
}

class FakeSubmissionRepository extends SubmissionRepository {
  failure: Error | null = null;
  sent: { graffiti: NewGraffiti; files: Blob[] }[] = [];

  create(graffiti: NewGraffiti, files: Blob[]): Promise<string> {
    this.sent.push({ graffiti, files });
    if (this.failure) return Promise.reject(this.failure);
    return Promise.resolve('a20c46cf-836b-42d8-9a96-67189aa8490f');
  }

  listArtists(): Promise<Artist[]> {
    return Promise.resolve([]);
  }
}

class FakeCategoryRepository extends CategoryRepository {
  failure: Error | null = null;
  calls = 0;

  getList(): Promise<Category[]> {
    this.calls++;
    if (this.failure) return Promise.reject(this.failure);
    return Promise.resolve(CATEGORIES);
  }

  getById(id: string): Promise<Category> {
    return Promise.resolve(CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]);
  }

  getCoverImage(): Promise<string | null> {
    return Promise.resolve(null);
  }
}

describe('SubmitPage', () => {
  let fixture: ComponentFixture<SubmitPage>;
  let page: SubmitPage;
  let el: HTMLElement;
  let camera: FakeCamera;
  let geolocation: FakeGeolocation;
  let submissions: FakeSubmissionRepository;
  let categories: FakeCategoryRepository;
  let forceLogout: jasmine.Spy;

  beforeEach(async () => {
    camera = new FakeCamera();
    geolocation = new FakeGeolocation();
    submissions = new FakeSubmissionRepository();
    categories = new FakeCategoryRepository();
    forceLogout = jasmine.createSpy('forceLogout').and.resolveTo();
    spyOn(URL, 'revokeObjectURL');

    await TestBed.configureTestingModule({
      imports: [SubmitPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: CameraPort, useValue: camera },
        { provide: GeolocationPort, useValue: geolocation },
        { provide: SubmissionRepository, useValue: submissions },
        { provide: CategoryRepository, useValue: categories },
        { provide: AuthService, useValue: { forceLogout } },
        {
          provide: ToastController,
          useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() }) },
        },
      ],
    }).compileComponents();
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(SubmitPage);
    page = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await settle();
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  async function takePhotos(...photos: CapturedPhoto[]): Promise<void> {
    camera.queue.push(photos);
    await page.capture();
    await settle();
  }

  function text(selector: string): string | null {
    return el.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
  }

  function submitButton(): HTMLElement {
    return Array.from(el.querySelectorAll('ion-button')).find(
      (b) => b.textContent?.trim() === 'Publicar'
    ) as HTMLElement;
  }

  describe('the two fields', () => {
    /** Artist, state, description, latitude and longitude are not this form's business. */
    it('shows photos and category, and nothing the API treats as optional', async () => {
      await render();

      expect(el.querySelector('ion-select[label="Categoría"]')).not.toBeNull();
      expect(el.querySelector('ion-select[label="Artista"]')).toBeNull();
      expect(el.querySelector('ion-select[label="Estado"]')).toBeNull();
      expect(el.querySelector('ion-textarea')).toBeNull();
      expect(el.querySelector('ion-toggle')).toBeNull();
      expect(el.querySelector('ion-input')).toBeNull();
    });

    it('does not preselect a category on the person\'s behalf', async () => {
      await render();

      expect(page.categoryId()).toBe('');
    });
  });

  describe('what is missing', () => {
    it('is disabled and says a photo is missing when there is none', async () => {
      await render();
      page.categoryId.set(CATEGORIES[0].id);
      await settle();

      expect(page.canSubmit()).toBeFalse();
      expect(submitButton().hasAttribute('disabled')).toBeTrue();
      expect(text('.submit__missing')).toBe('Falta: al menos una foto.');
    });

    it('is disabled and says the category is missing when photos are chosen but no category', async () => {
      await render();
      await takePhotos(photo(1));

      expect(page.canSubmit()).toBeFalse();
      expect(text('.submit__missing')).toBe('Falta: la categoría.');
    });

    it('is disabled and says the location is missing when the device gave none', async () => {
      geolocation.failure = 'timeout';
      await render();
      await takePhotos(photo(1));
      page.categoryId.set(CATEGORIES[0].id);
      await settle();

      expect(page.canSubmit()).toBeFalse();
      expect(text('.submit__missing')).toBe('Falta: la ubicación.');
    });

    it('is enabled once a photo, a category and the position are all in', async () => {
      await render();
      await takePhotos(photo(1));
      page.categoryId.set(CATEGORIES[0].id);
      await settle();

      expect(page.canSubmit()).toBeTrue();
      expect(el.querySelector('.submit__missing')).toBeNull();
    });
  });

  describe('location failures', () => {
    it('explains a denied permission and how to grant it', async () => {
      geolocation.failure = 'permission_denied';
      await render();

      expect(text('.submit__location-error')).toContain('permiso está denegado');
      expect(text('.submit__location-error')).toContain('ajustes del dispositivo');
    });

    it('asks to switch location on when the service is off, not for the permission again', async () => {
      geolocation.failure = 'unavailable';
      await render();

      expect(text('.submit__location-error')).toContain('está desactivada');
      expect(text('.submit__location-error')).not.toContain('permiso');
    });

    it('offers to try again when no fix arrived in time', async () => {
      geolocation.failure = 'timeout';
      await render();

      expect(text('.submit__location-error')).toContain('a tiempo');
      expect(el.querySelector('.submit__location ion-button')?.textContent?.trim()).toBe('Reintentar');
    });

    /** The retry is about the position only: nothing already chosen is touched. */
    it('keeps the photos and the category across a retry that then succeeds', async () => {
      geolocation.failure = 'timeout';
      await render();
      await takePhotos(photo(1), photo(2));
      page.categoryId.set(CATEGORIES[1].id);
      await settle();
      expect(page.coordinates()).toBeNull();

      geolocation.failure = null;
      await page.locate();
      await settle();

      expect(page.coordinates()).toEqual(HERE);
      expect(page.photos().length).toBe(2);
      expect(page.categoryId()).toBe(CATEGORIES[1].id);
      expect(page.canSubmit()).toBeTrue();
      expect(text('.submit__location-ok')).toBe('Ubicación capturada');
    });
  });

  describe('upload limits', () => {
    it('refuses a sixth photo, says how many fit, and keeps the five', async () => {
      await render();
      await takePhotos(photo(1), photo(2), photo(3), photo(4), photo(5));
      expect(page.photos().length).toBe(UPLOAD_LIMITS.maxFiles);

      await takePhotos(photo(6));

      expect(page.photos().length).toBe(5);
      expect(page.photos().map((p) => p.previewUrl)).not.toContain('blob:test/photo-6');
      expect(text('.submit__photos-error')).toContain(`Caben ${UPLOAD_LIMITS.maxFiles} fotos como máximo`);
      expect(text('.submit__photos-error')).toContain('ya hay 5 elegidas');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test/photo-6');
    });

    it('drops a photo over the size cap, names the cap, and keeps the rest', async () => {
      await render();

      await takePhotos(photo(1), photo(2, UPLOAD_LIMITS.maxBytesPerFile + 1), photo(3));

      expect(page.photos().map((p) => p.previewUrl)).toEqual(['blob:test/photo-1', 'blob:test/photo-3']);
      expect(text('.submit__photos-error')).toContain('10 MB');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test/photo-2');
    });

    it('takes a photo of exactly the cap', async () => {
      await render();

      await takePhotos(photo(1, UPLOAD_LIMITS.maxBytesPerFile));

      expect(page.photos().length).toBe(1);
      expect(el.querySelector('.submit__photos-error')).toBeNull();
    });
  });

  describe('server rejection', () => {
    /** The server said what is wrong with the selection; the person fixes that, not the form. */
    it('shows the server\'s reason on a 422 and keeps the selection', async () => {
      submissions.failure = new ValidationError(
        'The files.0 must not be greater than 10240 kilobytes.',
        { 'files.0': ['The files.0 must not be greater than 10240 kilobytes.'] }
      );
      await render();
      await takePhotos(photo(1), photo(2));
      page.categoryId.set(CATEGORIES[0].id);
      await settle();

      await page.submit();
      await settle();

      expect(text('.submit__photos-error')).toBe('The files.0 must not be greater than 10240 kilobytes.');
      expect(page.photos().length).toBe(2);
      expect(page.categoryId()).toBe(CATEGORIES[0].id);
      expect(page.canSubmit()).toBeTrue();
      expect(forceLogout).not.toHaveBeenCalled();
    });

    it('sends exactly the two fields and the position, nothing optional', async () => {
      await render();
      await takePhotos(photo(1));
      page.categoryId.set(CATEGORIES[1].id);
      await settle();

      await page.submit();

      expect(submissions.sent.length).toBe(1);
      expect(submissions.sent[0].graffiti).toEqual({
        category: CATEGORIES[1].id,
        artistId: undefined,
        latitude: HERE.latitude,
        longitude: HERE.longitude,
        state: undefined,
        description: undefined,
      });
      expect(submissions.sent[0].files.length).toBe(1);
    });
  });

  describe('catalogue failure', () => {
    it('says the catalogue did not load and offers a retry instead of an empty selector', async () => {
      categories.failure = new Error('backend down');
      await render();

      expect(el.querySelector('ion-select')).toBeNull();
      expect(text('.submit__catalogue-error ion-note')).toBe('No se pudo cargar las categorías.');
      expect(el.querySelector('.submit__catalogue-error ion-button')?.textContent?.trim()).toBe('Reintentar');
    });

    it('brings the selector back once a retry succeeds', async () => {
      categories.failure = new Error('backend down');
      await render();

      categories.failure = null;
      await page.loadCategories();
      await settle();

      expect(categories.calls).toBe(2);
      expect(el.querySelector('.submit__catalogue-error')).toBeNull();
      expect(el.querySelectorAll('ion-select-option').length).toBe(CATEGORIES.length);
    });
  });
});
