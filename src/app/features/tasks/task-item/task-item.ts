import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Task } from '../../../core/models/task';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.html',
  styleUrl: './task-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskItemComponent {
  readonly task = input.required<Task>();

  readonly toggleDone = output<string>();
  readonly remove = output<string>();
}
