import { Routes } from '@angular/router';
import { taskExistsGuard } from '../../core/guards/task-exists.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';
import { TaskFormPage } from './task-form/task-form-page';
import { TaskListComponent } from './task-list/task-list';
import { taskResolver } from './task.resolver';

export const TASKS_ROUTES: Routes = [
  { path: '', title: 'Tasks', component: TaskListComponent },
  {
    path: 'new',
    title: 'New task',
    component: TaskFormPage,
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    title: 'Edit task',
    component: TaskFormPage,
    canActivate: [taskExistsGuard],
    canDeactivate: [unsavedChangesGuard],
    resolve: { task: taskResolver },
  },
];
