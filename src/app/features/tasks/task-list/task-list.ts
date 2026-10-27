import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Task } from '../../../core/models/task';
import { TaskItemComponent } from '../task-item/task-item';

@Component({
  selector: 'app-task-list',
  imports: [TaskItemComponent],
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
}
