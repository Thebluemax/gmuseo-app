import { bootstrapApplication } from '@angular/platform-browser';
import { provideAppInitializer, provideZonelessChangeDetection, inject } from '@angular/core';
import { provideRouter, RouteReuseStrategy, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { API_BASE_URL } from './app/shared/infrastructure/api.config';
import { GraffitiRepository } from './app/graffiti/domain/repositories/graffiti.repository';
import { HttpGraffitiRepository } from './app/graffiti/infrastructure/repositories/http-graffiti.repository';
import { CategoryRepository } from './app/catalog/domain/category.repository';
import { HttpCategoryRepository } from './app/catalog/infrastructure/http-category.repository';
import { AuthRepository } from './app/auth/domain/auth.repository';
import { SanctumAuthRepository } from './app/auth/infrastructure/sanctum-auth.repository';
import { AuthService } from './app/auth/application/auth.service';
import { SecureTokenStorage } from './app/auth/domain/token-storage';
import { SecureTokenStorageNative } from './app/auth/infrastructure/secure-token.storage.native';
import { SecureTokenStorageWeb } from './app/auth/infrastructure/secure-token.storage.web';
import { authInterceptor } from './app/auth/infrastructure/auth.interceptor';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    { provide: GraffitiRepository, useClass: HttpGraffitiRepository },
    { provide: CategoryRepository, useClass: HttpCategoryRepository },
    { provide: AuthRepository, useClass: SanctumAuthRepository },
    // Keychain/Keystore on device, in-memory in the browser.
    {
      provide: SecureTokenStorage,
      useClass: Capacitor.isNativePlatform() ? SecureTokenStorageNative : SecureTokenStorageWeb,
    },
    // Rehydrate in-memory token signals from secure storage before routes resolve.
    provideAppInitializer(() => inject(AuthService).hydrate()),
  ],
}).catch(console.error);
