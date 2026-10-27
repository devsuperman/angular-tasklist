import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { APP_CONFIG, appConfigFactory } from './core/config/app-config';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { AppUpdateService } from './core/services/app-update.service';
import { PersistenceService } from './core/services/persistence.service';
import { StorageService, storageFactory } from './core/services/storage.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch(), withInterceptors([loadingInterceptor, errorInterceptor])),
    { provide: APP_CONFIG, useFactory: appConfigFactory },
    { provide: StorageService, useFactory: storageFactory },
    // Start saving and tab syncing as soon as the app starts
    provideAppInitializer(() => {
      inject(PersistenceService);
      inject(AppUpdateService);
    }),
    // Offline support (production builds only). The path is relative, so it follows <base href>
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
