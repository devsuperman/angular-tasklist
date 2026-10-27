import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { Observable, map, timer } from 'rxjs';
import { Task } from '../../core/models/task';

/**
 * Async: the title must be unique within the selected project.
 * The short timer stands in for a server check, and shows the `pending` state.
 */
export function uniqueTitleValidator(
  tasks: () => readonly Task[],
  currentId: () => string | undefined,
): AsyncValidatorFn {
  return (control): Observable<{ titleTaken: true } | null> =>
    timer(150).pipe(
      map(() => {
        const title = String(control.value ?? '')
          .trim()
          .toLowerCase();
        const projectId = control.parent?.get('projectId')?.value;
        const taken = tasks().some(
          (t) =>
            t.id !== currentId() &&
            t.projectId === projectId &&
            t.title.trim().toLowerCase() === title,
        );
        return taken ? { titleTaken: true } : null;
      }),
    );
}

/** Cross-field: a high-priority task needs a due date. */
export const highPriorityNeedsDate: ValidatorFn = (group) => {
  const priority = group.get('priority')?.value;
  const dueDate = group.get('dueDate')?.value;
  return priority === 'high' && !dueDate ? { dueDateRequiredForHigh: true } : null;
};
