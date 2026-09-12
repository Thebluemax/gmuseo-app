import {
  AfterViewInit, Component, ElementRef, OnDestroy, computed, effect, input, output, signal,
  viewChild,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { Graffiti } from '../../../domain/models/graffiti.model';

interface ReelImage {
  id: string;
  url: string;
}

/**
 * The feed: vertical swipe moves between artworks, horizontal swipe moves
 * between the photos of the artwork on screen. The two axes never share a
 * meaning. Dots count `photosCount` as the API states it, not the photos
 * array, and an artwork with no photo keeps its place in the vertical run.
 */
@Component({
  selector: 'gm-graffiti-reels',
  templateUrl: './graffiti-reels.html',
  styleUrls: ['./graffiti-reels.scss'],
  imports: [RouterLink, DatePipe, DecimalPipe],
})
export class GraffitiReelsComponent implements AfterViewInit, OnDestroy {
  readonly graffitis = input.required<Graffiti[]>();

  /** Fires when the artwork on screen is the last one loaded: time to fetch more. */
  readonly reachedEnd = output<void>();

  readonly index = signal(0);
  readonly imageIndex = signal(0);

  readonly current = computed(() => this.graffitis()[this.index()] ?? null);
  readonly images = computed<ReelImage[]>(() => {
    const g = this.current();
    if (!g) return [];
    return g.photos.map((p) => ({ id: p.id, url: p.files.lg }));
  });
  readonly currentImage = computed(() => this.images()[this.imageIndex()] ?? null);
  /** One entry per dot. Hidden by the template when there is nothing to move between. */
  readonly dots = computed(() => Array.from({ length: this.current()?.photosCount ?? 0 }, (_, i) => i));

  private stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private startX = 0;
  private startY = 0;

  constructor() {
    effect(() => {
      const total = this.graffitis().length;
      if (total > 0 && this.index() >= total - 1) this.reachedEnd.emit();
    });
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
