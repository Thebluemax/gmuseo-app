import {
  AfterViewInit, Component, ElementRef, InjectionToken, OnDestroy, computed, effect, inject,
  input, output, signal, untracked, viewChild,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonSpinner } from '@ionic/angular/standalone';
import type { Graffiti } from '../../../domain/models/graffiti.model';

interface ReelImage {
  id: string;
  url: string;
}

/** What is known about one photo URL. Absent means nothing asked for it yet. */
export type PhotoState = 'loading' | 'ready' | 'error';

/**
 * The subset of `HTMLImageElement` a preload needs: set `src` and hear back.
 * Tests hand in a fake so no request leaves the browser.
 */
export interface PreloadImage {
  src: string;
  onload: ((ev: Event) => void) | null;
  onerror: ((ev: Event | string) => void) | null;
}

export const PRELOAD_IMAGE = new InjectionToken<() => PreloadImage>('PRELOAD_IMAGE', {
  providedIn: 'root',
  factory: () => () => new Image(),
});

/**
 * The feed: vertical swipe moves between artworks, horizontal swipe moves
 * between the photos of the artwork on screen. The two axes never share a
 * meaning. Dots count `photosCount` as the API states it, not the photos
 * array, and an artwork with no photo keeps its place in the vertical run.
 *
 * Photos are the `md` variant (700px): at phone width it is 1:1 and a fifth of
 * the weight of `lg`, which waits for a detail view with zoom. The `<img>` is
 * recreated per photo so a swipe never leaves the previous photo on screen
 * while the next one downloads; a loading state covers the gap, and the
 * neighbours (previous/next photo, first photo of the next artwork) are
 * fetched ahead so the common gesture lands on a photo already there.
 */
@Component({
  selector: 'gm-graffiti-reels',
  templateUrl: './graffiti-reels.html',
  styleUrls: ['./graffiti-reels.scss'],
  imports: [RouterLink, DatePipe, DecimalPipe, IonSpinner],
})
export class GraffitiReelsComponent implements AfterViewInit, OnDestroy {
  readonly graffitis = input.required<Graffiti[]>();

  /** Fires when the artwork on screen is the last one loaded: time to fetch more. */
  readonly reachedEnd = output<void>();

  readonly index = signal(0);
  readonly imageIndex = signal(0);

  readonly current = computed(() => this.graffitis()[this.index()] ?? null);
  readonly images = computed<ReelImage[]>(() => this.imagesOf(this.current()));
  readonly currentImage = computed(() => this.images()[this.imageIndex()] ?? null);
  /**
   * The photo on screen as a one-element list: `@for ... track id` gives a
   * fresh `<img>` per photo, where a bound `src` would keep showing the old
   * bitmap until the new one arrived.
   */
  readonly currentImages = computed(() => {
    const img = this.currentImage();
    return img ? [img] : [];
  });
  /** One entry per dot. Hidden by the template when there is nothing to move between. */
  readonly dots = computed(() => Array.from({ length: this.current()?.photosCount ?? 0 }, (_, i) => i));

  /** Per URL, what happened to it. Keyed by URL so a preload and the visible `<img>` agree. */
  readonly states = signal<Record<string, PhotoState>>({});
  readonly currentState = computed<PhotoState>(() => {
    const img = this.currentImage();
    return img ? this.states()[img.url] ?? 'loading' : 'loading';
  });

  private stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private newImage = inject(PRELOAD_IMAGE);
  private startX = 0;
  private startY = 0;

  constructor() {
    effect(() => {
      const total = this.graffitis().length;
      if (total > 0 && this.index() >= total - 1) this.reachedEnd.emit();
    });
    effect(() => this.preloadNeighbours());
  }

  ngAfterViewInit(): void {
    const el = this.stage().nativeElement;
    el.addEventListener('pointerdown', this.onDown);
    el.addEventListener('pointerup', this.onUp);
  }

  ngOnDestroy(): void {
    const el = this.stage().nativeElement;
    el.removeEventListener('pointerdown', this.onDown);
    el.removeEventListener('pointerup', this.onUp);
  }

  markReady(url: string): void {
    this.setState(url, 'ready');
  }

  markError(url: string): void {
    this.setState(url, 'error');
  }

  private imagesOf(g: Graffiti | null): ReelImage[] {
    if (!g) return [];
    return g.photos.map((p) => ({ id: p.id, url: p.files.md }));
  }

  /**
   * The three photos a gesture can land on next. Anything already asked for is
   * left alone, so a photo is fetched once whether by a preload or on screen.
   */
  private preloadNeighbours(): void {
    const images = this.images();
    const i = this.imageIndex();
    const candidates = [images[i + 1], images[i - 1], this.imagesOf(this.graffitis()[this.index() + 1] ?? null)[0]];
    // Read untracked: this effect writes `states` and must not re-run on it.
    const known = untracked(this.states);
    for (const candidate of candidates) {
      if (!candidate || candidate.url in known) continue;
      this.preload(candidate.url);
    }
  }

  private preload(url: string): void {
    this.setState(url, 'loading');
    const image = this.newImage();
    image.onload = () => this.setState(url, 'ready');
    image.onerror = () => this.setState(url, 'error');
    image.src = url;
  }

  private setState(url: string, state: PhotoState): void {
    this.states.update((current) => (current[url] === state ? current : { ...current, [url]: state }));
  }

  private onDown = (e: PointerEvent): void => {
    this.startX = e.clientX;
    this.startY = e.clientY;
  };

  private onUp = (e: PointerEvent): void => {
    this.onSwipe(e.clientX - this.startX, e.clientY - this.startY);
  };

  private onSwipe(dx: number, dy: number): void {
    const threshold = 50;
    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy < -threshold) this.step(this.index, this.graffitis().length, +1, true);
      else if (dy > threshold) this.step(this.index, this.graffitis().length, -1, true);
    } else {
      if (dx < -threshold) this.step(this.imageIndex, this.images().length, +1, false);
      else if (dx > threshold) this.step(this.imageIndex, this.images().length, -1, false);
    }
  }

  private step(target: typeof this.index, length: number, dir: 1 | -1, resetImage: boolean): void {
    const next = target() + dir;
    if (next < 0 || next >= length) return;
    target.set(next);
    if (resetImage) this.imageIndex.set(0);
  }
}
