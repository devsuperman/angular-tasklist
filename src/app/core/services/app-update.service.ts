import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, switchMap } from 'rxjs';
import { ConfirmService } from './confirm.service';

/** After a new deploy, the service worker downloads it in the background; offer to switch. */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  constructor() {
    const updates = inject(SwUpdate);
    if (!updates.isEnabled) return; // dev server, tests, or no service worker support
    const confirm = inject(ConfirmService);

    updates.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        switchMap(() =>
          confirm.confirm({
            title: $localize`Update available`,
            message: $localize`A new version of the app is ready. Reload now?`,
            confirmLabel: $localize`Reload`,
            cancelLabel: $localize`Later`,
          }),
        ),
        filter(Boolean),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => document.location.reload());
  }
}
