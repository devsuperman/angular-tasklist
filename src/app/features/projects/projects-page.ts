import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ProjectStore } from '../../core/services/project-store';
import { TaskStore } from '../../core/services/task-store';

@Component({
  selector: 'app-projects-page',
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage {
  private readonly projectStore = inject(ProjectStore);
  private readonly taskStore = inject(TaskStore);

  protected readonly projects = computed(() => {
    const tasks = this.taskStore.tasks();
    return this.projectStore.projects().map((project) => ({
      ...project,
      taskCount: tasks.filter((t) => t.projectId === project.id).length,
    }));
  });
}
