import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GraffitiReelsComponent } from './graffiti-reels';
import { Graffiti } from '../../../domain/models/graffiti.model';

function graffiti(overrides: Partial<Graffiti> = {}): Graffiti {
  return {
    id: 'a20c46cf-836b-42d8-9a96-67189aa8490f',
    category: 'a20c46cf-596c-4481-a214-ec3f025b83a8',
    artist: { id: 'a20c46cf-2c90-4a40-b83b-d5fa7755a33e', name: 'Artur Artist' },
    latitude: -5.6,
    longitude: 65.3,
    vote: 1,
    active: true,
    cover: '',
    sightings: [],
    ...overrides,
  };
}

describe('GraffitiReelsComponent authorship', () => {
  let fixture: ComponentFixture<GraffitiReelsComponent>;

  async function render(input: Graffiti): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [GraffitiReelsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(GraffitiReelsComponent);
    fixture.componentRef.setInput('graffitis', [input]);
    await fixture.whenStable();

    return fixture.nativeElement as HTMLElement;
  }

  it('names the artist and links to their collection', async () => {
    const el = await render(graffiti());

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
    const el = await render(graffiti({ artist: null }));

    expect(el.querySelector('a.reels__artist')).toBeNull();
    expect(el.querySelector('.reels__artist--unknown')?.textContent?.trim()).toBe(
      'Autor desconocido'
    );
  });
});
