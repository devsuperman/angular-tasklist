import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  kind: 'info' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, kind: Toast['kind'] = 'info', durationMs = 5000): void {
    const toast: Toast = { id: this.nextId++, message, kind };
    this._toasts.update((toasts) => [...toasts, toast]);
    if (durationMs > 0) setTimeout(() => this.dismiss(toast.id), durationMs);
  }

  error(message: string): void {
    this.show(message, 'error', 8000);
  }

  dismiss(id: number): void {
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }
}
