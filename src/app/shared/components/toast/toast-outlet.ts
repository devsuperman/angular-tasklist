import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-outlet',
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (toast of toasts(); track toast.id) {
        <div class="toast" [class.error]="toast.kind === 'error'">
          <span>{{ toast.message }}</span>
          <button type="button" aria-label="Dismiss" i18n-aria-label (click)="dismiss(toast.id)">
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-outlet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOutletComponent {
  private readonly service = inject(ToastService);
  protected readonly toasts = this.service.toasts;

  protected dismiss(id: number): void {
    this.service.dismiss(id);
  }
}
