import { bootstrapApplication } from '@angular/platform-browser';
import {
  Injector, provideAppInitializer, provideZonelessChangeDetection, inject,
} from '@angular/core';
import { provideRouter, RouteReuseStrategy, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideApiBaseUrl, ServerConfig } from './app/shared/application/server-config';
import { ServerUrlStore } from './app/shared/domain/server-url.store';
import { PreferencesServerUrlStore } from './app/shared/infrastructure/server-url.store.preferences';
import { GraffitiRepository } from './app/graffiti/domain/repositories/graffiti.repository';
import { HttpGraffitiRepository } from './app/graffiti/infrastructure/repositories/http-graffiti.repository';
import { ArtistRepository } from './app/artists/domain/artist.repository';
import { HttpArtistRepository } from './app/artists/infrastructure/http-artist.repository';
import { CategoryRepository } from './app/catalog/domain/category.repository';
import { HttpCategoryRepository } from './app/catalog/infrastructure/http-category.repository';
import { AuthRepository } from './app/auth/domain/auth.repository';
import { SanctumAuthRepository } from './app/auth/infrastructure/sanctum-auth.repository';
import { AuthService } from './app/auth/application/auth.service';
import { SecureTokenStorage } from './app/auth/domain/token-storage';
import { SecureTokenStorageNative } from './app/auth/infrastructure/secure-token.storage.native';
import { SecureTokenStorageWeb } from './app/auth/infrastructure/secure-token.storage.web';
import { authInterceptor } from './app/auth/infrastructure/auth.interceptor';
import { SubmissionRepository } from './app/submission/domain/submission.repository';
import { HttpSubmissionRepository } from './app/submission/infrastructure/http-submission.repository';
import { CameraPort } from './app/submission/domain/ports/camera.port';
import { CameraNative } from './app/submission/infrastructure/camera.native';
import { CameraWeb } from './app/submission/infrastructure/camera.web';
import { GeolocationPort } from './app/submission/domain/ports/geolocation.port';
import { GeolocationNative } from './app/submission/infrastructure/geolocation.native';
import { GeolocationWeb } from './app/submission/infrastructure/geolocation.web';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    // The API base URL is the one the device saved, else the build's
    // (`environment.apiUrl`). Interceptor and repositories all read this token.
    { provide: ServerUrlStore, useExisting: PreferencesServerUrlStore },
    provideApiBaseUrl(),
    { provide: GraffitiRepository, useClass: HttpGraffitiRepository },
    { provide: CategoryRepository, useClass: HttpCategoryRepository },
    { provide: ArtistRepository, useClass: HttpArtistRepository },
    { provide: AuthRepository, useClass: SanctumAuthRepository },
    { provide: SubmissionRepository, useClass: HttpSubmissionRepository },
    // Native camera/GPS on device, web fallbacks in the browser.
    { provide: CameraPort, useClass: Capacitor.isNativePlatform() ? CameraNative : CameraWeb },
    {
      provide: GeolocationPort,
      useClass: Capacitor.isNativePlatform() ? GeolocationNative : GeolocationWeb,
    },
    // Keychain/Keystore on device, in-memory in the browser.
    {
      provide: SecureTokenStorage,
      useClass: Capacitor.isNativePlatform() ? SecureTokenStorageNative : SecureTokenStorageWeb,
    },
    // Resolve the server first, then rehydrate the token signals from secure
    // storage, all before routes resolve. One initializer, in this order:
    // AuthService pulls in the auth repository, which reads `API_BASE_URL` the
    // moment it is built, so it must not exist until the server is known.
    provideAppInitializer(async () => {
      const injector = inject(Injector);
      await inject(ServerConfig).load();
      await injector.get(AuthService).hydrate();
    }),
  ],
}).catch(console.error);
