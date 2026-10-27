import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../../core/models/project';
import { Task } from '../../../core/models/task';
import { HighlightOverdueDirective } from '../../../shared/directives/highlight-overdue';
import { PriorityLabelPipe } from '../../../shared/pipes/priority-label.pipe';
import { RelativeDatePipe } from '../../../shared/pipes/relative-date.pipe';

@Component({
  selector: 'app-task-item',
  imports: [
    RouterLink,
    DatePipe,
    TitleCasePipe,
    HighlightOverdueDirective,
    PriorityLabelPipe,
    RelativeDatePipe,
  ],
  templateUrl: './task-item.html',
  styleUrl: './task-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskItemComponent {
  readonly task = input.required<Task>();
  readonly project = input<Project>();

  readonly toggleDone = output<string>();
  readonly remove = output<string>();
}
