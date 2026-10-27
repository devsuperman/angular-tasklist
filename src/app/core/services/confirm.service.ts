import { Dialog } from '@angular/cdk/dialog';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(Dialog);

  /** Emits true when the user confirms, false when they cancel or press Escape. */
  confirm(data: ConfirmDialogData): Observable<boolean> {
    const ref = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data,
      role: 'alertdialog',
      backdropClass: 'dialog-backdrop',
    });
    return ref.closed.pipe(map((confirmed) => confirmed === true));
  }
}
