/** Today's date in the user's time zone, as an ISO date string ('2026-10-27'). */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** True when the task has a due date before today and is not done yet. */
export function isOverdue(task: { dueDate?: string; done: boolean }, today = todayIso()): boolean {
  return !task.done && !!task.dueDate && task.dueDate < today;
}
