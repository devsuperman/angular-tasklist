import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { Project } from '../../../core/models/project';
import { Task } from '../../../core/models/task';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ProjectStore } from '../../../core/services/project-store';
import { TaskStore } from '../../../core/services/task-store';
import { CardComponent } from '../../../shared/components/card/card';
import { FeatureFlagDirective } from '../../../shared/directives/feature-flag';
import { AddTaskComponent } from '../add-task/add-task';
import { FilterBarComponent, StatusFilter } from '../filter-bar/filter-bar';
import { StatisticsPanelComponent } from '../statistics-panel/statistics-panel';
import { TaskItemComponent } from '../task-item/task-item';

@Component({
  selector: 'app-task-list',
  imports: [
    RouterLink,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    TaskItemComponent,
    FilterBarComponent,
    CardComponent,
    AddTaskComponent,
    StatisticsPanelComponent,
    FeatureFlagDirective,
  ],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  private readonly store = inject(TaskStore);
  private readonly confirm = inject(ConfirmService);
  protected readonly dragEnabled = inject(APP_CONFIG).features.dragAndDrop;
  protected readonly tasks = this.store.tasks;
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

  protected reorderLabel(task: Task): string {
    return $localize`Reorder ${task.title}:title:`;
  }

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
    const task = this.store.byId(id);
    if (!task) return;
    this.confirm
      .confirm({
        title: $localize`Delete task?`,
        message: $localize`"${task.title}:title:" will be deleted. This cannot be undone.`,
        confirmLabel: $localize`Delete`,
      })
      .subscribe((confirmed) => {
        if (confirmed) this.store.remove(id);
      });
  }

  protected drop(event: CdkDragDrop<Task[]>): void {
    this.move(event.previousIndex, event.currentIndex);
  }

  /** Keyboard alternative to dragging: arrow keys on the handle move the task. */
  protected moveBy(task: Task, delta: number, handle: HTMLElement): void {
    const from = this.visibleTasks().indexOf(task);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= this.visibleTasks().length) return;
    this.move(from, to);
    // The row is re-rendered in its new place; keep the focus on its handle
    queueMicrotask(() => handle.focus());
  }

  private move(from: number, to: number): void {
    if (from === to) return;
    const tasks = [...this.visibleTasks()]; // copy: never mutate signal values
    moveItemInArray(tasks, from, to);
    this.store.reorder(tasks.map((t) => t.id)); // the store sets `order`, persistence saves it
  }
}
