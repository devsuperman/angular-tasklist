import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TaskListComponent } from './features/tasks/task-list/task-list';

@Component({
  imports: [TaskListComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = signal('Tasklist');
}
