import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';
import { Task } from '../models/task';
import { isOverdue, todayIso } from '../utils/date';
import { StorageService } from './storage.service';

export type NewTask = Pick<Task, 'title' | 'priority' | 'projectId'> &
  Partial<Pick<Task, 'description' | 'dueDate' | 'tags'>>;

export type TaskChanges = Partial<Omit<Task, 'id' | 'createdAt'>>;

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly storage = inject(StorageService);
  private readonly key = `${inject(APP_CONFIG).storageKey}-tasks`;

  // Private and writable: only the store changes state
  private readonly _tasks = signal<Task[]>(this.load());

  // Public and read-only
  readonly tasks = this._tasks.asReadonly();
  readonly total = computed(() => this._tasks().length);
  readonly doneCount = computed(() => this._tasks().filter((t) => t.done).length);
  readonly pendingCount = computed(() => this.total() - this.doneCount());
  readonly overdueCount = computed(() => {
    const today = todayIso();
    return this._tasks().filter((t) => isOverdue(t, today)).length;
  });

  constructor() {
    // Sync the state to the outside world: a valid use of effect
    effect(() => this.storage.setItem(this.key, JSON.stringify(this._tasks())));
  }

  add(input: NewTask): Task {
    const task: Task = {
      id: crypto.randomUUID(),
      done: false,
      tags: [],
      order: this._tasks().length,
      createdAt: new Date().toISOString(),
      ...input,
    };
    this._tasks.update((tasks) => [...tasks, task]);
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

  byId(id: string): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }

  private load(): Task[] {
    try {
      const saved = JSON.parse(this.storage.getItem(this.key) ?? 'null') as Task[] | null;
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }
}
