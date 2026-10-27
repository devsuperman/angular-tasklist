import { InjectionToken } from '@angular/core';

export interface AppConfig {
  /** The localStorage key that holds all the app data. */
  storageKey: string;
  /** Demo data loaded on the first visit. Relative, so it works under any base href. */
  seedUrl: string;
  features: {
    statistics: boolean;
    dragAndDrop: boolean;
  };
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  storageKey: 'angular-tasklist',
  seedUrl: 'seed.json',
  features: { statistics: true, dragAndDrop: true },
};

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_APP_CONFIG,
});
