import { httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';
import { SeedData } from '../models/stored-data';
import { DataRepository, isSeedData } from './data-repository';

/**
 * Where the stores start from: the saved data, or `seed.json` on the first visit.
 */
@Injectable({ providedIn: 'root' })
export class InitialData {
  private readonly config = inject(APP_CONFIG);

  /** Read once, when the app starts. */
  readonly saved = inject(DataRepository).load();

  // Only request the seed when nothing was saved. A url of undefined means "do not load".
  private readonly seed = httpResource<SeedData>(
    () => (this.saved ? undefined : this.config.seedUrl),
    { parse: (raw) => parseSeed(raw) },
  );

  readonly value = computed<SeedData | null>(() => this.saved ?? this.seedValue());
  readonly isLoading = this.seed.isLoading;
  readonly error = this.seed.error;

  private seedValue(): SeedData | null {
    return this.seed.hasValue() ? this.seed.value() : null;
  }
}

function parseSeed(raw: unknown): SeedData {
  if (!isSeedData(raw)) throw new Error('seed.json does not have the expected shape.');
  return raw;
}
