import { DestroyRef, Injectable, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent } from 'rxjs';
import { DataRepository, StorageFullError } from './data-repository';
import { InitialData } from './initial-data';
import { ProjectStore } from './project-store';
import { TaskStore } from './task-store';
import { ToastService } from './toast.service';

/**
 * Saves the stores after every change, and loads changes made in other tabs.
 * Started once by `provideAppInitializer` in app.config.ts.
 */
@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private readonly repository = inject(DataRepository);
  private readonly tasks = inject(TaskStore);
  private readonly projects = inject(ProjectStore);
  private readonly toast = inject(ToastService);
  private readonly initial = inject(InitialData);

  constructor() {
    // Syncing signals to the outside world (localStorage) is a good use of an effect
    effect(() => {
      const data = { tasks: this.tasks.tasks(), projects: this.projects.projects() };
      if (this.initial.isLoading()) return; // do not save an empty list over the coming seed
      try {
        this.repository.save(data);
      } catch (error) {
        if (!(error instanceof StorageFullError)) throw error;
        this.toast.error('Your browser storage is full. The last change was not saved.');
      }
    });

    // The `storage` event fires in the *other* tabs when one tab writes
    fromEvent<StorageEvent>(window, 'storage')
      .pipe(
        filter((event) => this.repository.isOwnKey(event.key)),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => {
        const data = this.repository.load();
        if (!data) return;
        this.tasks.replaceAll(data.tasks);
        this.projects.replaceAll(data.projects);
      });
  }
}
