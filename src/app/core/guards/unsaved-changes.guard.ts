import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmService } from '../services/confirm.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component.hasUnsavedChanges() ||
  inject(ConfirmService).confirm({
    title: 'Leave this page?',
    message: 'You have unsaved changes. They will be lost.',
    confirmLabel: 'Leave',
    cancelLabel: 'Stay',
  });
