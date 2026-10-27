import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TaskStore } from '../services/task-store';

/** Sends unknown ids back to the list instead of showing an empty form. */
export const taskExistsGuard: CanActivateFn = (route) => {
  const id = route.paramMap.get('id');
  const exists = !!id && !!inject(TaskStore).byId(id);
  return exists || inject(Router).createUrlTree(['/tasks']);
};
