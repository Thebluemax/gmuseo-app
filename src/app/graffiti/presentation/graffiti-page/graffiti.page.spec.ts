import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular/standalone';

import { GraffitiPage } from './graffiti.page';
import { GraffitiFeedService } from '../../application/services/graffiti-feed.service';
import { AuthService } from '../../../auth/application/auth.service';
import { Graffiti } from '../../domain/models/graffiti.model';

function graffiti(id: string): Graffiti {
  return {
    id,
    category: 'a20c46cf-596c-4481-a214-ec3f025b83a8',
    artist: null,
    latitude: 41.38,
    longitude: 2.16,
    createdAt: '2026-09-13T12:51:56.000000Z',
    vote: 0,
    active: true,
    cover: '',
    photos: [],
    photosCount: 0,
  };
}

const OLD = graffiti('a20c46cf-836b-42d8-9a96-67189aa8490f');
const NEW = graffiti('a2bc7a6e-6ef8-4c65-be5c-f439bf104879');

/** The feed as the page sees it; `loadFirst` answers with whatever `nextPage` holds. */
class FakeFeed {
  items = signal<Graffiti[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  nextPage: Graffiti[] = [OLD];
  calls: string[] = [];

  async loadFirst(): Promise<void> {
    this.calls.push('loadFirst');
    await Promise.resolve();
    this.items.set(this.nextPage);
  }
  async loadNext(): Promise<void> { this.calls.push('loadNext'); }
  async retry(): Promise<void> { this.calls.push('retry'); }
}

describe('GraffitiPage', () => {
  let fixture: ComponentFixture<GraffitiPage>;
  let feed: FakeFeed;
  let presented: string[];
  let itemsWhenPresented: Graffiti[];

  beforeEach(async () => {
    feed = new FakeFeed();
    presented = [];
    itemsWhenPresented = [];
    history.replaceState({}, '');

    await TestBed.configureTestingModule({
      imports: [GraffitiPage],
      providers: [
        provideRouter([]),
        { provide: GraffitiFeedService, useValue: feed },
        { provide: AuthService, useValue: { isAuthenticated: signal(true) } },
        { provide: ModalController, useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() }) } },
        {
          provide: ToastController,
          useValue: {
            create: (opts: { message: string }) => {
              presented.push(opts.message);
              itemsWhenPresented = feed.items();
              return Promise.resolve({ present: () => Promise.resolve() });
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GraffitiPage);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads the first page once when created', () => {
    expect(feed.calls).toEqual(['loadFirst']);
  });

  it('does nothing on entering without an alta behind', async () => {
    await fixture.componentInstance.ionViewWillEnter();

    expect(feed.calls).toEqual(['loadFirst']);
    expect(presented).toEqual([]);
  });

  /**
   * Ionic keeps the page alive, so `ngOnInit` does not run again. Back from an
   * alta the listing is reloaded from the top, and the notice comes after the
   * new piece is on screen: a toast over a loading feed went unseen.
   */
  it('reloads from the top after an alta and says so once the new piece is in', async () => {
    feed.nextPage = [NEW, OLD];
    history.replaceState({ createdId: NEW.id }, '');

    await fixture.componentInstance.ionViewWillEnter();

    expect(feed.calls).toEqual(['loadFirst', 'loadFirst']);
    expect(feed.items()[0]).toBe(NEW);
    expect(presented).toEqual(['¡Graffiti publicado!']);
    expect(itemsWhenPresented[0]).toBe(NEW);
  });

  it('says it only once: entering again does not repeat the reload or the notice', async () => {
    feed.nextPage = [NEW, OLD];
    history.replaceState({ createdId: NEW.id }, '');
    await fixture.componentInstance.ionViewWillEnter();

    await fixture.componentInstance.ionViewWillEnter();

    expect(feed.calls).toEqual(['loadFirst', 'loadFirst']);
    expect(presented.length).toBe(1);
  });
});
