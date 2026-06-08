import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, RouteReuseStrategy, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { API_BASE_URL } from './app/shared/infrastructure/api.config';
import { GraffitiRepository } from './app/catalog/domain/graffiti.repository';
import { HttpGraffitiRepository } from './app/catalog/infrastructure/http-graffiti.repository';
import { CategoryRepository } from './app/catalog/domain/category.repository';
import { HttpCategoryRepository } from './app/catalog/infrastructure/http-category.repository';
import { AuthRepository } from './app/auth/domain/auth.repository';
import { SanctumAuthRepository } from './app/auth/infrastructure/sanctum-auth.repository';
import { authInterceptor } from './app/auth/infrastructure/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: API_BASE_URL, useValue: 'http://localhost/api' },
    { provide: GraffitiRepository, useClass: HttpGraffitiRepository },
    { provide: CategoryRepository, useClass: HttpCategoryRepository },
    { provide: AuthRepository, useClass: SanctumAuthRepository },
  ],
}).catch(console.error);
