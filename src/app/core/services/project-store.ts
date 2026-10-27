import { Injectable, inject, linkedSignal } from '@angular/core';
import { Project } from '../models/project';
import { InitialData } from './initial-data';

/** Used when there is no saved data and the seed could not be loaded. */
export const DEFAULT_PROJECTS: Project[] = [{ id: 'inbox', name: 'Inbox', color: '#6b7280' }];

@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private readonly initial = inject(InitialData);

  private readonly _projects = linkedSignal<Project[]>(() => {
    const projects = this.initial.value()?.projects;
    return projects?.length ? projects : DEFAULT_PROJECTS;
  });
  readonly projects = this._projects.asReadonly();

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

  /** Replaces the whole list, for example with changes made in another tab. */
  replaceAll(projects: Project[]): void {
    this._projects.set(projects.length ? projects : DEFAULT_PROJECTS);
  }

  byId(id: string): Project | undefined {
    return this._projects().find((p) => p.id === id);
  }
}
