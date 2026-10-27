import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ProjectStore } from '../../../core/services/project-store';
import { TaskStore } from '../../../core/services/task-store';
import { CardComponent } from '../../../shared/components/card/card';
import { AddTaskComponent } from '../add-task/add-task';
import { FilterBarComponent, StatusFilter } from '../filter-bar/filter-bar';
import { TaskItemComponent } from '../task-item/task-item';

@Component({
  selector: 'app-task-list',
  imports: [TaskItemComponent, FilterBarComponent, CardComponent, AddTaskComponent],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  private readonly store = inject(TaskStore);
  private readonly projects = inject(ProjectStore);

  protected readonly total = this.store.total;
  protected readonly doneCount = this.store.doneCount;
  protected readonly pendingCount = this.store.pendingCount;
  protected readonly overdueCount = this.store.overdueCount;

  // UI state stays in the component
  protected readonly filter = signal<StatusFilter>('all');

  protected readonly visibleTasks = computed(() => {
    const filter = this.filter();
    return this.store.tasks().filter((t) => filter === 'all' || (filter === 'done') === t.done);
  });

  protected add(title: string): void {
    const projectId = this.projects.projects()[0]?.id ?? 'inbox';
    this.store.add({ title, priority: 'medium', projectId });
  }

  protected toggle(id: string): void {
    this.store.toggle(id);
  }

  protected remove(id: string): void {
    this.store.remove(id);
  }
}
