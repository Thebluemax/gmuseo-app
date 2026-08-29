import {
  AfterViewInit, Component, ElementRef, OnDestroy, computed, input, signal, viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Graffiti } from '../../../domain/models/graffiti.model';

interface ReelImage {
  id: string;
  url: string;
}

// TODO(mock): fallback images while a graffiti has no sighting photos.
function mockImages(seed: string): ReelImage[] {
  return [0, 1, 2].map((i) => ({
    id: `${seed}-mock-${i}`,
    url: `https://picsum.photos/seed/${seed}-${i}/900/1600`,
  }));
}

@Component({
  selector: 'gm-graffiti-reels',
  templateUrl: './graffiti-reels.html',
  styleUrls: ['./graffiti-reels.scss'],
  imports: [RouterLink],
})
export class GraffitiReelsComponent implements AfterViewInit, OnDestroy {
  readonly graffitis = input.required<Graffiti[]>();

  readonly index = signal(0);
  readonly imageIndex = signal(0);

  readonly current = computed(() => this.graffitis()[this.index()] ?? null);
  readonly images = computed<ReelImage[]>(() => {
    const g = this.current();
    if (!g) return [];
    const photos = g.sightings.flatMap((s) =>
      s.photos.map((p) => ({ id: p.id, url: p.files.lg }))
    );
    return photos.length > 0 ? photos : mockImages(g.id);
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
