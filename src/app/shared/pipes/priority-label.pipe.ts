import { Pipe, PipeTransform } from '@angular/core';
import { Priority } from '../../core/models/task';

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: $localize`:Task priority:Low`,
  medium: $localize`:Task priority:Medium`,
  high: $localize`:Task priority:High`,
};

@Pipe({ name: 'priorityLabel' })
export class PriorityLabelPipe implements PipeTransform {
  transform(priority: Priority): string {
    return PRIORITY_LABELS[priority];
  }
}
