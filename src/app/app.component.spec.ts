import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the Ionic app shell around a router outlet', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('ion-app')).toBeTruthy();
    expect(host.querySelector('ion-app > ion-router-outlet')).toBeTruthy();
  });

  /**
   * Navigation lives in the tab shell (`gm-tabs`), not in the root component.
   * The legacy side menu this spec used to assert on was removed in c600c69.
   */
  it('carries no navigation chrome of its own', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('ion-tab-button').length).toBe(0);
    expect(host.querySelectorAll('ion-menu').length).toBe(0);
  });
});
