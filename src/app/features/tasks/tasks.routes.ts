import { Routes } from '@angular/router';
import { taskExistsGuard } from '../../core/guards/task-exists.guard';
import { TaskFormPage } from './task-form/task-form-page';
import { TaskListComponent } from './task-list/task-list';
import { taskResolver } from './task.resolver';

export const TASKS_ROUTES: Routes = [
  { path: '', title: 'Tasks', component: TaskListComponent },
  { path: 'new', title: 'New task', component: TaskFormPage },
  {
    path: ':id',
    title: 'Edit task',
    component: TaskFormPage,
    canActivate: [taskExistsGuard],
    resolve: { task: taskResolver },
  },
];
