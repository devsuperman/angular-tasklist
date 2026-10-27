import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { Project } from '../../../core/models/project';
import { ProjectStore } from '../../../core/services/project-store';
import { TaskStore } from '../../../core/services/task-store';
import { CardComponent } from '../../../shared/components/card/card';
import { AddTaskComponent } from '../add-task/add-task';
import { FilterBarComponent, StatusFilter } from '../filter-bar/filter-bar';
import { TaskItemComponent } from '../task-item/task-item';

@Component({
  selector: 'app-task-list',
  imports: [RouterLink, TaskItemComponent, FilterBarComponent, CardComponent, AddTaskComponent],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  private readonly store = inject(TaskStore);
  protected readonly projects = inject(ProjectStore).projects;

  protected readonly total = this.store.total;
  protected readonly doneCount = this.store.doneCount;
  protected readonly pendingCount = this.store.pendingCount;
  protected readonly overdueCount = this.store.overdueCount;
  protected readonly isLoading = this.store.isLoading;
  protected readonly loadError = this.store.loadError;

  // UI state stays in the component
  protected readonly filter = signal<StatusFilter>('all');
  protected readonly projectFilter = signal<string>(''); // '' means every project
  protected readonly query = signal(''); // what the user typed

  // Signal → Observable (to apply time) → Signal (for computed and the template)
  private readonly debouncedQuery = toSignal(
    toObservable(this.query).pipe(
      map((q) => q.trim().toLowerCase()),
      debounceTime(250),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  private readonly projectsById = computed(
    () => new Map(this.projects().map((p) => [p.id, p] as const)),
  );

  protected readonly visibleTasks = computed(() => {
    const status = this.filter();
    const projectId = this.projectFilter();
    const q = this.debouncedQuery();
    return this.store
      .tasks()
      .filter(
        (t) =>
          (status === 'all' || (status === 'done') === t.done) &&
          (!projectId || t.projectId === projectId) &&
          (!q || t.title.toLowerCase().includes(q)),
      );
  });

  protected projectOf(projectId: string): Project | undefined {
    return this.projectsById().get(projectId);
  }

  protected add(title: string): void {
    const projectId = this.projectFilter() || (this.projects()[0]?.id ?? 'inbox');
    this.store.add({ title, priority: 'medium', projectId });
  }

  protected toggle(id: string): void {
    this.store.toggle(id);
  }

  protected remove(id: string): void {
    this.store.remove(id);
  }
}
