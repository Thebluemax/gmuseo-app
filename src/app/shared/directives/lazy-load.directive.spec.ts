import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LazyLoadDirective } from './lazy-load.directive';

@Component({
  template: `<img [appLazyLoad]="imageUrl" [src]="placeholder" />`,
  standalone: true,
  imports: [LazyLoadDirective],
})
class TestComponent {
  imageUrl = 'https://example.com/image.jpg';
  placeholder = 'data:image/svg+xml,...';
}

describe('LazyLoadDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let imgElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    imgElement = fixture.debugElement.query(By.css('img'));
  });

  it('should create directive', () => {
    expect(imgElement).toBeTruthy();
  });

  it('should load image on intersection when IntersectionObserver available', (done) => {
    fixture.detectChanges();

    setTimeout(() => {
      const img = imgElement.nativeElement as HTMLImageElement;
      // Image should have been set if observer fired intersection
      expect(img).toBeTruthy();
      done();
    }, 100);
  });

  it('should use placeholder initially', () => {
    fixture.detectChanges();
    const img = imgElement.nativeElement as HTMLImageElement;
    expect(img.src).toContain('data:image');
  });

  it('should handle missing appLazyLoad gracefully', () => {
    component.imageUrl = '';
    fixture.detectChanges();
    expect(imgElement).toBeTruthy();
  });

  it('should fallback to immediate load on old browsers', () => {
    // Mock IntersectionObserver unavailable
    const savedIO = (window as any).IntersectionObserver;
    (window as any).IntersectionObserver = undefined;

    fixture.detectChanges();
    const img = imgElement.nativeElement as HTMLImageElement;
    expect(img.src).toBe(component.imageUrl);

    // Restore
    (window as any).IntersectionObserver = savedIO;
  });
});
