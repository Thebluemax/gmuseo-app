import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraffitiListComponent } from './graffiti-list';
import type { Graffiti } from '../../../domain/models/graffiti.model';

describe('GraffitiListComponent', () => {
  let component: GraffitiListComponent;
  let fixture: ComponentFixture<GraffitiListComponent>;

  const mockGraffiti: Graffiti[] = Array.from({ length: 5 }, (_, i) => ({
    id: `graffiti-${i}`,
    title: `Graffiti ${i}`,
    cover: `https://example.com/cover-${i}.jpg`,
    photosCount: 3,
    vote: 10 + i,
  }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraffitiListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GraffitiListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('graffitis', mockGraffiti);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', null);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use grid layout for <100 items', () => {
    fixture.detectChanges();
    expect(component.useVirtualScroll()).toBe(false);
  });

  it('should use virtual scroll for >100 items', () => {
    const manyItems = Array.from({ length: 150 }, (_, i) => ({
      id: `item-${i}`,
      title: `Item ${i}`,
      cover: `https://example.com/${i}.jpg`,
      photosCount: 1,
      vote: i,
    }));

    fixture.componentRef.setInput('graffitis', manyItems);
    fixture.detectChanges();

    expect(component.useVirtualScroll()).toBe(true);
  });

  it('should emit refreshRequested on refresh', () => {
    spyOn(component.refreshRequested, 'emit');
    const mockEvent = { detail: { complete: jasmine.createSpy('complete') } };

    component.onRefresh(mockEvent);

    expect(component.refreshRequested.emit).toHaveBeenCalled();
    expect(mockEvent.detail.complete).toHaveBeenCalled();
  });

  it('should show loading spinner when loading=true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('ion-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should show error message when error is set', () => {
    const errorMsg = 'Failed to load graffitis';
    fixture.componentRef.setInput('error', errorMsg);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    const errorText = fixture.nativeElement.querySelector('ion-text');
    expect(errorText?.textContent).toContain(errorMsg);
  });

  it('should render all graffitis in grid mode', () => {
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('gm-graffiti-card');
    expect(cards.length).toBe(mockGraffiti.length);
  });
});
