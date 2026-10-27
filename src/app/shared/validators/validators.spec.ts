import { FormControl, FormGroup } from '@angular/forms';
import { firstValueFrom, isObservable } from 'rxjs';
import { aTask } from '../../testing/test-data';
import { notInThePast } from './not-in-the-past';
import { highPriorityNeedsDate, uniqueTitleValidator } from './task-validators';

describe('notInThePast', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date(2026, 9, 27, 12) })); // Oct 27, local time
  afterEach(() => vi.useRealTimers());

  it('rejects yesterday', () => {
    expect(notInThePast(new FormControl('2026-10-26'))).toEqual({ pastDate: true });
  });

  it('accepts today, the future and an empty value', () => {
    expect(notInThePast(new FormControl('2026-10-27'))).toBeNull();
    expect(notInThePast(new FormControl('2027-01-01'))).toBeNull();
    expect(notInThePast(new FormControl(''))).toBeNull();
  });
});

describe('highPriorityNeedsDate', () => {
  const group = (priority: string, dueDate: string) =>
    new FormGroup({ priority: new FormControl(priority), dueDate: new FormControl(dueDate) });

  it('requires a due date only for high priority', () => {
    expect(highPriorityNeedsDate(group('high', ''))).toEqual({ dueDateRequiredForHigh: true });
    expect(highPriorityNeedsDate(group('high', '2027-01-01'))).toBeNull();
    expect(highPriorityNeedsDate(group('low', ''))).toBeNull();
  });
});

describe('uniqueTitleValidator', () => {
  const tasks = [aTask({ id: 'a', title: 'Buy coffee', projectId: 'p1' })];

  async function validate(title: string, projectId: string, currentId?: string) {
    const control = new FormControl(title);
    new FormGroup({ title: control, projectId: new FormControl(projectId) });
    const result = uniqueTitleValidator(
      () => tasks,
      () => currentId,
    )(control);
    return isObservable(result) ? firstValueFrom(result) : result;
  }

  it('rejects a title already used in the same project, ignoring case and spaces', async () => {
    expect(await validate('  buy COFFEE ', 'p1')).toEqual({ titleTaken: true });
  });

  it('accepts the same title in another project, or for the task being edited', async () => {
    expect(await validate('Buy coffee', 'p2')).toBeNull();
    expect(await validate('Buy coffee', 'p1', 'a')).toBeNull();
  });
});
