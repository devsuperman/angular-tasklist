import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task } from '../../../core/models/task';

@Component({
  selector: 'app-task-form-page',
  imports: [RouterLink],
  templateUrl: './task-form-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormPage {
  readonly id = input<string>(); // from /tasks/:id; undefined on /tasks/new
  readonly task = input<Task>(); // from the resolver's `task` key

  protected readonly isEdit = computed(() => this.id() !== undefined);
}
