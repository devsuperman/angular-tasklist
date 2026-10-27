import { Injectable, effect, inject, signal } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';
import { Project } from '../models/project';
import { StorageService } from './storage.service';

export const DEFAULT_PROJECTS: Project[] = [
  { id: 'inbox', name: 'Inbox', color: '#6b7280' },
  { id: 'study', name: 'Study', color: '#2563eb' },
  { id: 'work', name: 'Work', color: '#d97706' },
  { id: 'home', name: 'Home', color: '#16a34a' },
];

@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private readonly storage = inject(StorageService);
  private readonly key = `${inject(APP_CONFIG).storageKey}-projects`;

  private readonly _projects = signal<Project[]>(this.load());
  readonly projects = this._projects.asReadonly();

  constructor() {
    effect(() => this.storage.setItem(this.key, JSON.stringify(this._projects())));
  }

  add(input: Omit<Project, 'id'>): Project {
    const project: Project = { id: crypto.randomUUID(), ...input };
    this._projects.update((projects) => [...projects, project]);
    return project;
  }

  update(id: string, changes: Partial<Omit<Project, 'id'>>): void {
    this._projects.update((projects) =>
      projects.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );
  }

  remove(id: string): void {
    this._projects.update((projects) => projects.filter((p) => p.id !== id));
  }

  byId(id: string): Project | undefined {
    return this._projects().find((p) => p.id === id);
  }

  private load(): Project[] {
    try {
      const saved = JSON.parse(this.storage.getItem(this.key) ?? 'null') as Project[] | null;
      return Array.isArray(saved) ? saved : DEFAULT_PROJECTS;
    } catch {
      return DEFAULT_PROJECTS;
    }
  }
}
