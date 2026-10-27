import { Directive, computed, input } from '@angular/core';
import { isOverdue, todayIso } from '../../core/utils/date';

/** Adds the `overdue` class (styled in styles.scss) when a due date has passed. */
@Directive({
  selector: '[appHighlightOverdue]',
  host: {
    '[class.overdue]': 'isOverdue()',
  },
})
export class HighlightOverdueDirective {
  readonly dueDate = input<string | undefined>(undefined, { alias: 'appHighlightOverdue' });
  readonly done = input(false);

  readonly isOverdue = computed(() =>
    isOverdue({ dueDate: this.dueDate() || undefined, done: this.done() }, todayIso()),
  );
}
