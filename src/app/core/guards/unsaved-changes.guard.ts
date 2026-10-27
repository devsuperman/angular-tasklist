import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmService } from '../services/confirm.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component.hasUnsavedChanges() ||
  inject(ConfirmService).confirm({
    title: $localize`Leave this page?`,
    message: $localize`You have unsaved changes. They will be lost.`,
    confirmLabel: $localize`Leave`,
    cancelLabel: $localize`Stay`,
  });
