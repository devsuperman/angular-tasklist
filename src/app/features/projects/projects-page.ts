import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Project } from '../../core/models/project';
import { ProjectStore } from '../../core/services/project-store';
import { TaskStore } from '../../core/services/task-store';
import { CardComponent } from '../../shared/components/card/card';
import { ProjectFormComponent } from './project-form/project-form';

@Component({
  selector: 'app-projects-page',
  imports: [CardComponent, ProjectFormComponent],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage {
  private readonly projectStore = inject(ProjectStore);
  private readonly taskStore = inject(TaskStore);

  protected readonly editingId = signal<string | null>(null);

  protected readonly projects = computed(() => {
    const tasks = this.taskStore.tasks();
    return this.projectStore.projects().map((project) => ({
      ...project,
      taskCount: tasks.filter((t) => t.projectId === project.id).length,
    }));
  });

  protected readonly canDelete = computed(() => this.projects().length > 1);

  protected add(input: Omit<Project, 'id'>): void {
    this.projectStore.add(input);
  }

  protected rename(id: string, changes: Omit<Project, 'id'>): void {
    this.projectStore.update(id, changes);
    this.editingId.set(null);
  }

  protected remove(project: Project & { taskCount: number }): void {
    const message =
      project.taskCount > 0
        ? `Delete "${project.name}" and its ${project.taskCount} tasks?`
        : `Delete "${project.name}"?`;
    if (!confirm(message)) return;
    this.taskStore.removeByProject(project.id);
    this.projectStore.remove(project.id);
  }
}
