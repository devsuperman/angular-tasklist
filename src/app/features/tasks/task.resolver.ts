import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Task } from '../../core/models/task';
import { TaskStore } from '../../core/services/task-store';

/** Loads the task before the page opens. It arrives in the page as the `task` input. */
export const taskResolver: ResolveFn<Task | undefined> = (route) =>
  inject(TaskStore).byId(route.paramMap.get('id') ?? '');
