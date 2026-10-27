import { PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Project } from '../../../core/models/project';
import { Task } from '../../../core/models/task';

interface ProjectStats {
  id: string;
  name: string;
  done: number;
  pending: number;
  total: number;
}

/** F9: done vs. pending per project. Loaded lazily with @defer, so it is its own chunk. */
@Component({
  selector: 'app-statistics-panel',
  imports: [PercentPipe],
  templateUrl: './statistics-panel.html',
  styleUrl: './statistics-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsPanelComponent {
  readonly tasks = input.required<readonly Task[]>();
  readonly projects = input.required<readonly Project[]>();

  protected readonly rows = computed<ProjectStats[]>(() => {
    const tasks = this.tasks();
    return this.projects()
      .map((project) => {
        const own = tasks.filter((t) => t.projectId === project.id);
        const done = own.filter((t) => t.done).length;
        return {
          id: project.id,
          name: project.name,
          done,
          pending: own.length - done,
          total: own.length,
        };
      })
      .filter((row) => row.total > 0);
  });

  /** Every bar uses the same scale: the busiest project fills the track. */
  protected readonly max = computed(() => Math.max(1, ...this.rows().map((r) => r.total)));

  protected readonly doneRatio = computed(() => {
    const total = this.tasks().length;
    return total ? this.tasks().filter((t) => t.done).length / total : 0;
  });
}
