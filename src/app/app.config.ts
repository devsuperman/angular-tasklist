import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { APP_CONFIG, DEFAULT_APP_CONFIG } from './core/config/app-config';
import { StorageService, storageFactory } from './core/services/storage.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: APP_CONFIG, useValue: DEFAULT_APP_CONFIG },
    { provide: StorageService, useFactory: storageFactory },
  ],
};
