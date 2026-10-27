import { Injectable, inject } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';
import { Project } from '../models/project';
import { SeedData, StoredData } from '../models/stored-data';
import { PRIORITIES, Task } from '../models/task';
import { StorageService } from './storage.service';

export const CURRENT_VERSION = 1;

/** Thrown by `save()` when localStorage has no room left (about 5 MB per site). */
export class StorageFullError extends Error {
  constructor() {
    super('Browser storage is full.');
    this.name = 'StorageFullError';
  }
}

/** The only code that knows how the data is stored: one JSON value under one key. */
@Injectable({ providedIn: 'root' })
export class DataRepository {
  private readonly storage = inject(StorageService);
  private readonly key = inject(APP_CONFIG).storageKey;

  /** Returns the saved data, or null when there is none or it cannot be used. */
  load(): StoredData | null {
    const raw = this.storage.getItem(this.key);
    if (!raw) return null;
    try {
      const data: unknown = JSON.parse(raw);
      if (!isRecord(data) || typeof data['version'] !== 'number') return null;
      const migrated = migrate(data);
      return isSeedData(migrated) ? { ...migrated, version: CURRENT_VERSION } : null;
    } catch {
      return null; // invalid JSON: fall back to the seed data
    }
  }

  save(data: SeedData): void {
    const value = JSON.stringify({ version: CURRENT_VERSION, ...data } satisfies StoredData);
    try {
      this.storage.setItem(this.key, value);
    } catch (error) {
      if (isQuotaExceeded(error)) throw new StorageFullError();
      throw error;
    }
  }

  /** True when a raw value saved by another tab belongs to this repository. */
  isOwnKey(key: string | null): boolean {
    return key === this.key || key === null; // null: storage.clear()
  }
}

/** Upgrades older saved shapes, one version at a time. */
function migrate(data: Record<string, unknown>): Record<string, unknown> {
  // Example for a future version 2:
  // if (data['version'] === 1) data = { ...data, version: 2, tasks: ... };
  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTask(value: unknown): value is Task {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['title'] === 'string' &&
    typeof value['done'] === 'boolean' &&
    PRIORITIES.includes(value['priority'] as Task['priority']) &&
    typeof value['projectId'] === 'string' &&
    Array.isArray(value['tags']) &&
    typeof value['order'] === 'number'
  );
}

function isProject(value: unknown): value is Project {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    typeof value['color'] === 'string'
  );
}

/** `http.get<T>()` and `JSON.parse()` only promise a type: this checks it. */
export function isSeedData(value: unknown): value is SeedData {
  return (
    isRecord(value) &&
    Array.isArray(value['tasks']) &&
    value['tasks'].every(isTask) &&
    Array.isArray(value['projects']) &&
    value['projects'].every(isProject)
  );
}

function isQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}
