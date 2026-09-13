import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GraffitiReelsComponent, PRELOAD_IMAGE, PreloadImage } from './graffiti-reels';
import { Graffiti, GraffitiPhoto } from '../../../domain/models/graffiti.model';

function photo(n: number): GraffitiPhoto {
  return {
    id: `a20c46cf-9670-4025-82f4-80e63c4acc0${n}`,
    files: {
      lg: `http://media.test/p${n}_1900.jpg`,
      md: `http://media.test/p${n}_700.jpg`,
      sm: `http://media.test/p${n}_350.jpg`,
      thumb: `http://media.test/p${n}_150.jpg`,
    },
    createdAt: '2026-05-17T07:03:35.000000Z',
  };
}

function graffiti(overrides: Partial<Graffiti> = {}): Graffiti {
  const photos = overrides.photos ?? [photo(1), photo(2), photo(3)];

  return {
    id: 'a20c46cf-836b-42d8-9a96-67189aa8490f',
    category: 'a20c46cf-596c-4481-a214-ec3f025b83a8',
    artist: { id: 'a20c46cf-2c90-4a40-b83b-d5fa7755a33e', name: 'Artur Artist' },
    latitude: -5.6,
    longitude: 65.3,
    createdAt: '2026-05-17T07:03:35.000000Z',
    vote: 1,
    active: true,
    cover: '',
    photos,
    photosCount: photos.length,
    ...overrides,
  };
}

/** A preload that never touches the network: the test fires `onload`/`onerror` itself. */
class FakeImage implements PreloadImage {
  src = '';
  onload: ((ev: Event) => void) | null = null;
  onerror: ((ev: Event | string) => void) | null = null;
}

describe('GraffitiReelsComponent', () => {
  let fixture: ComponentFixture<GraffitiReelsComponent>;
  let el: HTMLElement;
  let preloads: FakeImage[];

  async function render(input: Graffiti[]): Promise<void> {
    preloads = [];
    await TestBed.configureTestingModule({
      imports: [GraffitiReelsComponent],
      providers: [
        provideRouter([]),
        { provide: PRELOAD_IMAGE, useValue: () => { const img = new FakeImage(); preloads.push(img); return img; } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GraffitiReelsComponent);
    fixture.componentRef.setInput('graffitis', input);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  }

  async function swipe(dx: number, dy: number): Promise<void> {
    const stage = el.querySelector('.reels') as HTMLElement;
    stage.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 300 }));
    stage.dispatchEvent(new PointerEvent('pointerup', { clientX: 100 + dx, clientY: 300 + dy }));
    await fixture.whenStable();
  }

  function dots(): NodeListOf<Element> {
    return el.querySelectorAll('.reels__dot');
  }

  function shownImage(): string | null {
    return el.querySelector('img.reels__img')?.getAttribute('src') ?? null;
  }

  function shownImageElement(): HTMLImageElement | null {
    return el.querySelector('img.reels__img');
  }

  function loadingOverlay(): Element | null {
    return el.querySelector('.reels__loading');
  }

  async function shownImageLoads(): Promise<void> {
    shownImageElement()?.dispatchEvent(new Event('load'));
    await fixture.whenStable();
  }

  async function shownImageFails(): Promise<void> {
    shownImageElement()?.dispatchEvent(new Event('error'));
    await fixture.whenStable();
  }

  async function preloadFinishes(url: string): Promise<void> {
    const image = preloads.find((p) => p.src === url);
    if (!image) throw new Error(`no preload asked for ${url}`);
    image.onload?.(new Event('load'));
    await fixture.whenStable();
  }

  describe('authorship', () => {
    it('names the artist and links to their collection', async () => {
      await render([graffiti()]);

      const link = el.querySelector('a.reels__artist');
      expect(link?.textContent?.trim()).toBe('Artur Artist');
      expect(link?.getAttribute('href')).toBe(
        '/tabs/artist/a20c46cf-2c90-4a40-b83b-d5fa7755a33e'
      );
    });

    /**
     * Anonymous is the majority case, so it must read as a real answer — and it
     * must not render a link, which would be a link to nowhere.
     */
    it('states unknown authorship without rendering a broken link', async () => {
      await render([graffiti({ artist: null })]);

      expect(el.querySelector('a.reels__artist')).toBeNull();
      expect(el.querySelector('.reels__artist--unknown')?.textContent?.trim()).toBe(
        'Autor desconocido'
      );
    });
  });

  describe('photos and dots', () => {
    it('shows the first photo of the artwork, from the flattened list', async () => {
      await render([graffiti()]);

      expect(shownImage()).toBe('http://media.test/p1_700.jpg');
    });

    /**
     * `md` is the feed's variant: 1:1 at phone width and a fifth of the weight
     * of `lg`. Nothing in the DOM may point at the large one.
     */
    it('loads the md variant and never the lg one', async () => {
      await render([graffiti()]);

      expect(shownImage()).toContain('_700.jpg');
      expect(el.innerHTML).not.toContain('_1900.jpg');
    });

    /** The dots come from `photosCount`, one per photo the API counts. */
    it('draws one dot per photosCount with the current one highlighted', async () => {
      await render([graffiti({ photosCount: 3 })]);

      expect(dots().length).toBe(3);
      expect(dots()[0].classList).toContain('reels__dot--active');
      expect(dots()[1].classList).not.toContain('reels__dot--active');
    });

    it('draws no dots for an artwork with a single photo', async () => {
      await render([graffiti({ photos: [photo(1)], photosCount: 1 })]);

      expect(dots().length).toBe(0);
    });

    /**
     * No photo is not a gap: the artwork keeps its slot in the vertical run and
     * the stage says why it is dark, instead of a blank or a placeholder image.
     */
    it('marks an artwork with no photos instead of leaving the stage blank', async () => {
      await render([graffiti({ photos: [], photosCount: 0 })]);

      expect(shownImage()).toBeNull();
      expect(el.querySelector('.reels__img--empty')).not.toBeNull();
      expect(el.querySelector('.reels__empty-label')?.textContent?.trim()).toBe('Sin foto todavía');
      expect(dots().length).toBe(0);
    });
  });

  describe('gestures', () => {
    const first = graffiti();
    const second = graffiti({
      id: 'a20c46cf-8a12-4a70-9ad1-2f0f6d9c1a53',
      photos: [photo(7), photo(8)],
      photosCount: 2,
    });

    it('moves to the next photo of the same artwork on a horizontal swipe', async () => {
      await render([first, second]);

      await swipe(-120, 0);

      expect(fixture.componentInstance.index()).toBe(0);
      expect(fixture.componentInstance.imageIndex()).toBe(1);
      expect(shownImage()).toBe('http://media.test/p2_700.jpg');
      expect(dots()[1].classList).toContain('reels__dot--active');
    });

    it('moves to the next artwork on a vertical swipe, starting at its first photo', async () => {
      await render([first, second]);
      await swipe(-120, 0);

      await swipe(0, -120);

      expect(fixture.componentInstance.index()).toBe(1);
      expect(fixture.componentInstance.imageIndex()).toBe(0);
      expect(shownImage()).toBe('http://media.test/p7_700.jpg');
    });

    it('does not change anything on a horizontal swipe over a single photo', async () => {
      await render([graffiti({ photos: [photo(1)], photosCount: 1 })]);

      await swipe(-120, 0);

      expect(fixture.componentInstance.imageIndex()).toBe(0);
      expect(shownImage()).toBe('http://media.test/p1_700.jpg');
    });

    it('stops at the ends instead of wrapping', async () => {
      await render([first, second]);

      await swipe(0, 120);
      expect(fixture.componentInstance.index()).toBe(0);

      await swipe(120, 0);
      expect(fixture.componentInstance.imageIndex()).toBe(0);
    });
  });

  describe('loading state', () => {
    const first = graffiti();
    const second = graffiti({
      id: 'a20c46cf-8a12-4a70-9ad1-2f0f6d9c1a53',
      photos: [photo(7), photo(8)],
      photosCount: 2,
    });

    it('covers the slot until the photo on screen has loaded', async () => {
      await render([first]);
      expect(loadingOverlay()).not.toBeNull();

      await shownImageLoads();

      expect(loadingOverlay()).toBeNull();
    });

    /**
     * A bound `src` would keep the old bitmap on screen while the next photo
     * downloads, which reads as "the swipe did nothing". The element is
     * replaced on the spot, the dot moves on the spot, and the slot shows it
     * is loading.
     */
    it('replaces the img element and moves the dot before the next photo has loaded', async () => {
      await render([first]);
      await shownImageLoads();
      const before = shownImageElement();

      await swipe(-120, 0);

      expect(shownImageElement()).not.toBe(before);
      expect(shownImage()).toBe('http://media.test/p2_700.jpg');
      expect(dots()[1].classList).toContain('reels__dot--active');
      expect(loadingOverlay()).not.toBeNull();

      await shownImageLoads();
      expect(loadingOverlay()).toBeNull();
    });

    it('preloads the next and previous photo and the first photo of the next artwork', async () => {
      await render([first, second]);

      expect(preloads.map((p) => p.src)).toEqual([
        'http://media.test/p2_700.jpg',
        'http://media.test/p7_700.jpg',
      ]);

      await shownImageLoads();
      await swipe(-120, 0);

      // p1 is already known (it loaded on screen), so only p3 is new.
      expect(preloads.map((p) => p.src)).toEqual([
        'http://media.test/p2_700.jpg',
        'http://media.test/p7_700.jpg',
        'http://media.test/p3_700.jpg',
      ]);
    });

    it('shows a preloaded photo without passing through the loading state', async () => {
      await render([first, second]);
      await preloadFinishes('http://media.test/p2_700.jpg');

      await swipe(-120, 0);

      expect(shownImage()).toBe('http://media.test/p2_700.jpg');
      expect(loadingOverlay()).toBeNull();
    });

    it('lands on the next artwork without loading when its first photo was preloaded', async () => {
      await render([first, second]);
      await preloadFinishes('http://media.test/p7_700.jpg');

      await swipe(0, -120);

      expect(shownImage()).toBe('http://media.test/p7_700.jpg');
      expect(loadingOverlay()).toBeNull();
    });

    /** One broken photo is said so in its slot and blocks neither gesture. */
    it('says a photo could not load and keeps both gestures working', async () => {
      await render([first, second]);

      await shownImageFails();

      expect(shownImageElement()).toBeNull();
      expect(el.querySelector('.reels__img--error')?.textContent?.trim()).toBe('No se pudo cargar la foto');
      expect(dots().length).toBe(3);

      await swipe(-120, 0);
      expect(shownImage()).toBe('http://media.test/p2_700.jpg');
      expect(dots()[1].classList).toContain('reels__dot--active');

      await swipe(0, -120);
      expect(shownImage()).toBe('http://media.test/p7_700.jpg');
      expect(fixture.componentInstance.index()).toBe(1);
    });
  });

  describe('end of the loaded page', () => {
    it('asks for more when the artwork on screen becomes the last one loaded', async () => {
      await render([graffiti(), graffiti({ id: 'a20c46cf-8a12-4a70-9ad1-2f0f6d9c1a53' })]);
      const reached = jasmine.createSpy('reachedEnd');
      fixture.componentInstance.reachedEnd.subscribe(reached);

      await swipe(0, -120);

      expect(reached).toHaveBeenCalledTimes(1);
    });

    /** A page of one is already at its end: the next page must be asked for at once. */
    it('asks for more as soon as a single-artwork page is shown', async () => {
      const reached = jasmine.createSpy('reachedEnd');
      await TestBed.configureTestingModule({
        imports: [GraffitiReelsComponent],
        providers: [provideRouter([])],
      }).compileComponents();
      fixture = TestBed.createComponent(GraffitiReelsComponent);
      fixture.componentInstance.reachedEnd.subscribe(reached);
      fixture.componentRef.setInput('graffitis', [graffiti()]);

      await fixture.whenStable();

      expect(reached).toHaveBeenCalledTimes(1);
    });
  });

  describe('identity line', () => {
    /** No title and no name: coordinates and date are how an artwork is told apart. */
    it('shows the coordinates and the creation date', async () => {
      await render([graffiti({ latitude: 41.38745, longitude: 2.16862, createdAt: '2026-05-17T07:03:35.000000Z' })]);

      expect(el.querySelector('.reels__coords')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('41.38745, 2.16862');
      expect(el.querySelector('.reels__date')?.textContent?.trim()).toBe('17 May 2026');
    });

    it('omits the date when the artwork has none, instead of inventing one', async () => {
      await render([graffiti({ createdAt: null })]);

      expect(el.querySelector('.reels__coords')).not.toBeNull();
      expect(el.querySelector('.reels__date')).toBeNull();
    });
  });
});
