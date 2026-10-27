import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
}

/** Opened with the CDK `Dialog`: focus trap, Escape to close and focus restore come for free. */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 id="confirm-title">{{ data.title }}</h2>
    <p id="confirm-message">{{ data.message }}</p>
    <div class="actions">
      <button type="button" class="secondary" (click)="ref.close(false)" cdkFocusInitial>
        {{ data.cancelLabel ?? cancel }}
      </button>
      <button type="button" class="danger" (click)="ref.close(true)">
        {{ data.confirmLabel }}
      </button>
    </div>
  `,
  styleUrl: './confirm-dialog.scss',
  host: {
    'aria-labelledby': 'confirm-title',
    'aria-describedby': 'confirm-message',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly cancel = 'Cancel';
}
