import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appLazyLoad]',
  standalone: true,
})
export class LazyLoadDirective implements OnInit {
  @Input() appLazyLoad: string = '';
  @Input() appLazyLoadPlaceholder: string = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3C/svg%3E';

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    if (!this.appLazyLoad) return;

    if ('IntersectionObserver' in window) {
      // Use IntersectionObserver to detect when element enters viewport.
      // Only loads image when visible + 50px margin for early loading.
      // Reduces memory and bandwidth by skipping off-screen images.
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          this.el.nativeElement.src = this.appLazyLoad;
          observer.unobserve(this.el.nativeElement);
        }
      }, { rootMargin: '50px' });

      observer.observe(this.el.nativeElement);
    } else {
      // Fallback for older browsers: load immediately
      this.el.nativeElement.src = this.appLazyLoad;
    }
  }
}
