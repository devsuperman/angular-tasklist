import { Injectable } from '@angular/core';

/** Key/value storage. Code asks for this abstraction, never for `localStorage` directly. */
export abstract class StorageService {
  abstract getItem(key: string): string | null;
  abstract setItem(key: string, value: string): void;
  abstract removeItem(key: string): void;
}

@Injectable()
export class LocalStorageService extends StorageService {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}

/** Keeps data in memory: used in tests, and when localStorage is not available. */
export class MemoryStorageService extends StorageService {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

/** Uses localStorage when it works, and falls back to memory (private mode, storage disabled). */
export function storageFactory(): StorageService {
  try {
    const probe = '__angular-tasklist-probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return new LocalStorageService();
  } catch {
    return new MemoryStorageService();
  }
}
