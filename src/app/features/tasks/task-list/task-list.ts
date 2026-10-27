import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Task } from '../../../core/models/task';
import { isOverdue, todayIso } from '../../../core/utils/date';
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
  protected readonly tasks = signal<Task[]>([
    {
      id: '1',
      title: 'Read the signals guide',
      done: false,
      priority: 'high',
      dueDate: '2026-11-03',
      tags: ['angular'],
      projectId: 'study',
      order: 0,
      createdAt: '2026-10-01',
    },
    {
      id: '2',
      title: 'Buy coffee',
      done: true,
      priority: 'low',
      tags: [],
      projectId: 'home',
      order: 1,
      createdAt: '2026-10-02',
    },
    {
      id: '3',
      title: 'Send the weekly report',
      done: false,
      priority: 'medium',
      dueDate: '2026-10-20',
      tags: ['work'],
      projectId: 'work',
      order: 2,
      createdAt: '2026-10-03',
    },
  ]);

  protected readonly filter = signal<StatusFilter>('all');

  protected readonly total = computed(() => this.tasks().length);
  protected readonly doneCount = computed(() => this.tasks().filter((t) => t.done).length);
  protected readonly pendingCount = computed(() => this.total() - this.doneCount());
  protected readonly overdueCount = computed(() => {
    const today = todayIso();
    return this.tasks().filter((t) => isOverdue(t, today)).length;
  });

  protected readonly visibleTasks = computed(() => {
    const filter = this.filter();
    return this.tasks().filter((t) => filter === 'all' || (filter === 'done') === t.done);
  });

  protected add(title: string): void {
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      done: false,
      priority: 'medium',
      tags: [],
      projectId: 'inbox',
      order: this.tasks().length,
      createdAt: new Date().toISOString(),
    };
    this.tasks.update((tasks) => [...tasks, task]);
  }

  protected toggle(id: string): void {
    this.tasks.update((tasks) => tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  protected remove(id: string): void {
    this.tasks.update((tasks) => tasks.filter((t) => t.id !== id));
  }
}
