import {
  AfterViewInit, Component, ElementRef, OnDestroy, computed, input, signal, viewChild,
} from '@angular/core';
import type { Graffiti, GraffitiGallery } from '../../../domain/models/graffiti.model';

// TODO(mock): fallback images while backend galleries are empty. Remove once API returns galleries.
function mockGalleries(seed: string): GraffitiGallery[] {
  return [0, 1, 2].map((i) => ({
    id: `${seed}-mock-${i}`,
    url: `https://picsum.photos/seed/${seed}-${i}/900/1600`,
    size: 'lg',
  }));
}

@Component({
  selector: 'gm-graffiti-reels',
  templateUrl: './graffiti-reels.html',
  styleUrls: ['./graffiti-reels.scss'],
})
export class GraffitiReels implements AfterViewInit, OnDestroy {
  readonly graffitis = input.required<Graffiti[]>();

  readonly index = signal(0);
  readonly imageIndex = signal(0);

  readonly current = computed(() => this.graffitis()[this.index()] ?? null);
  readonly images = computed(() => {
    const g = this.current();
    if (!g) return [];
    return g.galleries.length > 0 ? g.galleries : mockGalleries(g.id);
  });
  readonly currentImage = computed(() => this.images()[this.imageIndex()] ?? null);

  private stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private startX = 0;
  private startY = 0;

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
