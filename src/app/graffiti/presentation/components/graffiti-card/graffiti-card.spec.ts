import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraffitiCardComponent } from './graffiti-card';
import type { Graffiti } from '../../../domain/models/graffiti.model';

describe('GraffitiCardComponent', () => {
  let component: GraffitiCardComponent;
  let fixture: ComponentFixture<GraffitiCardComponent>;

  const mockGraffiti: Graffiti = {
    id: 'test-graffiti',
    title: 'Test Graffiti',
    cover: 'https://example.com/cover.jpg',
    photosCount: 5,
    vote: 42,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraffitiCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GraffitiCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('graffiti', mockGraffiti);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display graffiti metadata', () => {
    fixture.detectChanges();
    const cardContent = fixture.nativeElement.textContent;
    expect(cardContent).toContain('5');
    expect(cardContent).toContain('42');
  });

  it('should have lazy-load directive on image', () => {
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('appLazyLoad')).toBe(mockGraffiti.cover);
  });

  it('should use placeholder initially', () => {
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img.src).toContain('data:image');
  });

  it('should be clickable and navigate to detail', () => {
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('ion-card');
    expect(card.getAttribute('routerLink')).toBeTruthy();
  });

  it('should handle graffiti without cover', () => {
    const noCoverbito = { ...mockGraffiti, cover: '' };
    fixture.componentRef.setInput('graffiti', noCoverbito);
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeFalsy();
  });

  it('should update when graffiti input changes', () => {
    const newGraffiti: Graffiti = {
      id: 'new-graffiti',
      title: 'New Graffiti',
      cover: 'https://example.com/new.jpg',
      photosCount: 10,
      vote: 100,
    };

    fixture.componentRef.setInput('graffiti', newGraffiti);
    fixture.detectChanges();

    const cardContent = fixture.nativeElement.textContent;
    expect(cardContent).toContain('10');
    expect(cardContent).toContain('100');
  });
});
