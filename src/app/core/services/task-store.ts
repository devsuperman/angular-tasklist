import { Injectable, computed, inject, linkedSignal } from '@angular/core';
import { Task } from '../models/task';
import { isOverdue, todayIso } from '../utils/date';
import { InitialData } from './initial-data';

export type NewTask = Pick<Task, 'title' | 'priority' | 'projectId'> &
  Partial<Pick<Task, 'description' | 'dueDate' | 'tags'>>;

export type TaskChanges = Partial<Omit<Task, 'id' | 'createdAt'>>;

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly initial = inject(InitialData);

  // Starts from the saved data or the seed, then the user changes it with set / update
  private readonly _tasks = linkedSignal<Task[]>(() =>
    sortByOrder(this.initial.value()?.tasks ?? []),
  );

  // Public and read-only
  readonly tasks = this._tasks.asReadonly();
  readonly isLoading = this.initial.isLoading;
  readonly loadError = this.initial.error;

  readonly total = computed(() => this._tasks().length);
  readonly doneCount = computed(() => this._tasks().filter((t) => t.done).length);
  readonly pendingCount = computed(() => this.total() - this.doneCount());
  readonly overdueCount = computed(() => {
    const today = todayIso();
    return this._tasks().filter((t) => isOverdue(t, today)).length;
  });

  add(input: NewTask): Task {
    const tasks = this._tasks();
    const task: Task = {
      id: crypto.randomUUID(),
      done: false,
      tags: [],
      order: tasks.reduce((max, t) => Math.max(max, t.order + 1), 0),
      createdAt: new Date().toISOString(),
      ...input,
    };
    this._tasks.set([...tasks, task]);
    return task;
  }

  toggle(id: string): void {
    this._tasks.update((tasks) => tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  update(id: string, changes: TaskChanges): void {
    this._tasks.update((tasks) => tasks.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  }

  remove(id: string): void {
    this._tasks.update((tasks) => tasks.filter((t) => t.id !== id));
  }

  /** Removes every task of a project (used when the project is deleted). */
  removeByProject(projectId: string): void {
    this._tasks.update((tasks) => tasks.filter((t) => t.projectId !== projectId));
  }

  /** Replaces the whole list, for example with changes made in another tab. */
  replaceAll(tasks: Task[]): void {
    this._tasks.set(sortByOrder(tasks));
  }

  byId(id: string): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }
}

function sortByOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.order - b.order);
}
