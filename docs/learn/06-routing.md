# Chapter 6 — Routing

**Phase 4** · Concepts: `provideRouter`, `Routes`, `<router-outlet>`, `routerLink`, `routerLinkActive`, route parameters, `withComponentInputBinding()`, lazy loading (`loadComponent`, `loadChildren`), functional guards (`CanActivateFn`, `CanDeactivateFn`), resolvers (`ResolveFn`), redirects, wildcard routes, `withViewTransitions()`.

---

## 6.1 What routing is

### What

In a single-page app there is only one HTML page (`index.html`). The **router** maps the URL to a component and renders it inside `<router-outlet />`, without reloading the page. Changing pages swaps components; the browser's back button and deep links still work.

### Why

The app has separate screens (the task list, a form, the projects page). Each needs its own URL so a user can bookmark `/tasks/123`, share it, refresh it and press Back. Routing also lets us **load each feature only when it is visited** (lazy loading), so the first page loads faster.

### How it is applied here

🟢 **In the code today**: the router is already turned on, but with no routes.

```ts
// app.config.ts
provideRouter(routes);

// app.routes.ts
export const routes: Routes = [];
```

```html
<!-- app.html -->
<main>
  <router-outlet />
</main>
```

The `<header>` is outside the outlet, so it stays while pages change below it.

---

## 6.2 The route table

🔵 **Planned (Phase 4)**: the routes from [TECH_STACK.md](../TECH_STACK.md):

```ts
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  {
    path: 'tasks',
    loadChildren: () => import('./features/tasks/tasks.routes').then((m) => m.TASKS_ROUTES),
  },
  {
    path: 'projects',
    title: 'Projects',
    loadComponent: () => import('./features/projects/projects-page').then((m) => m.ProjectsPage),
  },
  {
    path: '**',
    title: 'Page not found',
    loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
```

```ts
// features/tasks/tasks.routes.ts
export const TASKS_ROUTES: Routes = [
  { path: '', title: 'Tasks', component: TaskListPage },
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
```

Things to notice:

- **Order matters.** The router takes the **first** match. `new` must come before `:id`, or "new" would be read as an id. `**` (the wildcard) must be last.
- **`pathMatch: 'full'`** on the empty path. Without it, `''` would match the start of every URL.
- **`title`** sets `document.title` for the page. Good for accessibility and browser history.
- Paths have no leading `/`.

---

## 6.3 Lazy loading

### What

`loadComponent` and `loadChildren` take a function that **dynamically imports** a file. The build puts that code in a separate JavaScript file (a "chunk") that the browser downloads only when the route is visited.

- `loadComponent`: one standalone component.
- `loadChildren`: a whole set of child routes (a feature).

### Why

A user who opens `/tasks` does not need the projects page code yet. Smaller first download = faster first screen. It also enforces the folder rule from Chapter 1: if `features/tasks` imported from `features/projects`, the chunks would get tangled.

> If a module exports the component as `default`, you can drop the `.then`: `loadComponent: () => import('./projects-page')`.

### How you will see it

Phase 4's "done when" says: _the network tab shows the lazy chunks loading_. Open DevTools → Network → JS, start on `/tasks`, then click "Projects": a new `chunk-xxxx.js` appears. `ng build` also prints the lazy chunks in a separate table.

---

## 6.4 Navigating: `routerLink` and `routerLinkActive`

```html
<!-- app.html, planned -->
<header class="app-header">
  <h1>{{ title() }}</h1>
  <nav aria-label="Main">
    <a routerLink="/tasks" routerLinkActive="active" ariaCurrentWhenActive="page">Tasks</a>
    <a routerLink="/projects" routerLinkActive="active" ariaCurrentWhenActive="page">Projects</a>
  </nav>
</header>
```

```ts
// app.ts
imports: [RouterOutlet, RouterLink, RouterLinkActive],
```

- **`routerLink`**, not `href`. A plain `href` reloads the whole page and loses all in-memory state. `routerLink` navigates inside the app and still renders a real `href`, so "open in new tab" works.
- **`routerLinkActive="active"`** adds the class when the link's route is active. `ariaCurrentWhenActive="page"` sets `aria-current` for screen readers.
- Dynamic links: `[routerLink]="['/tasks', task.id]"` → `/tasks/123`.
- Relative links (no leading `/`) are resolved from the current route.
- **In code:** `inject(Router).navigate(['/tasks'])` or `navigateByUrl('/tasks')`, for example after saving a form.

> The base path: on GitHub Pages the app lives at `/angular-tasklist/`. You still write `routerLink="/tasks"`; the router adds the `<base href>` for you (Chapter 12).

---

## 6.5 Route parameters as component inputs

### What

In `/tasks/:id`, `:id` is a **route parameter**. With `withComponentInputBinding()`, the router sets it as a component **input** with the same name.

```ts
// app.config.ts
provideRouter(routes, withComponentInputBinding());
```

```ts
// features/tasks/task-form-page.ts
export class TaskFormPage {
  readonly id = input<string>(); // from /tasks/:id; undefined on /tasks/new
  readonly task = input<Task>(); // from the resolver's `task` key (6.7)

  protected readonly isEdit = computed(() => this.id() !== undefined);
}
```

Route params, query params (`?filter=done`), static route `data` and resolver results all bind to inputs by name.

### Why

The component does not need to know about the router: it only has inputs. That makes it simpler to test (just set the input) and to reuse. The older way, `inject(ActivatedRoute).paramMap.pipe(...)`, still works, but needs RxJS and more code.

> Angular reuses the component when only the parameter changes (`/tasks/1` → `/tasks/2`). With signal inputs, everything derived with `computed` updates by itself. This is another reason to derive with `computed` instead of reading inputs once in the constructor.

### Bonus: the filter in the URL

The status filter from Chapter 4 could become a query param: `/tasks?status=done`. Then `readonly status = input<StatusFilter>('all')` on `TaskListPage`, and the filter bar navigates with `[queryParams]="{ status: 'done' }"`. The filter would survive a refresh and be shareable.

---

## 6.6 Functional guards

### What

A **guard** decides whether navigation may continue. Guards are plain functions that run in an injection context, so they can call `inject()`.

| Type               | Question                                 | Returns                                         |
| ------------------ | ---------------------------------------- | ----------------------------------------------- |
| `canActivate`      | May the user enter this route?           | `true`, `false`, or a `UrlTree` to redirect     |
| `canDeactivate`    | May the user leave this component?       | `true` / `false` (or a Promise / Observable)    |
| `canMatch`         | Should this route config be used at all? | Same as `canActivate`; also blocks lazy loading |
| `canActivateChild` | Same as `canActivate`, for every child   |                                                 |

### `taskExistsGuard`

🔵 **Planned (Phase 4)**: redirect to the list when the id does not exist.

```ts
// core/guards/task-exists.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TaskStore } from '../services/task-store';

export const taskExistsGuard: CanActivateFn = (route) => {
  const id = route.paramMap.get('id');
  const exists = !!id && !!inject(TaskStore).byId(id);
  return exists || inject(Router).createUrlTree(['/tasks']);
};
```

Return a `UrlTree` instead of calling `router.navigate()`: the router then cancels this navigation and starts the redirect cleanly.

### `unsavedChangesGuard`

🔵 **Planned (Phase 5)**: warn before leaving a form with unsaved changes (a user story in [BUSINESS_PLAN.md](../BUSINESS_PLAN.md)).

```ts
// core/guards/unsaved-changes.guard.ts
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component.hasUnsavedChanges() || confirm('You have unsaved changes. Leave anyway?');
```

The guard depends on an **interface**, not on `TaskFormPage`, so the project form can use it too. Each form page implements `hasUnsavedChanges()` (for example, `return this.form.dirty && !this.saved;`, see Chapter 7).

> Guards are about **user experience**, not security. In this app all data is in the user's own browser anyway, but remember the rule for apps with a server: the server must check permissions too.

---

## 6.7 Resolvers

### What

A **resolver** fetches data **before** the route activates. The component receives the data ready to use.

```ts
// features/tasks/task.resolver.ts
export const taskResolver: ResolveFn<Task | undefined> = (route) =>
  inject(TaskStore).byId(route.paramMap.get('id')!);
```

With `resolve: { task: taskResolver }` and component input binding, `TaskFormPage` gets `readonly task = input<Task>()`.

### Why (and when not)

The edit form must be filled with the task's values. With a resolver, the form never renders empty and then jumps. Here the data is already in memory, so the resolver is instant: it is in TASKS.md **to learn the concept**. With slow data (an HTTP call), a resolver delays the page change until the data arrives, so many apps prefer to navigate at once and show a loading state (for example, with `httpResource`, Chapter 8). Know both options.

---

## 6.8 Not found and view transitions

- **404 page:** the `**` route catches every unknown URL. `NotFoundPage` should explain the problem and link back to `/tasks`.
- **`withViewTransitions()`** uses the browser's View Transitions API to animate between pages (a cross-fade by default). One line in `provideRouter`, and it is ignored by browsers that do not support it.

```ts
provideRouter(routes, withComponentInputBinding(), withViewTransitions());
```

---

## 6.9 Deep links on GitHub Pages

When a user refreshes `/angular-tasklist/tasks/123`, the browser asks GitHub Pages for that file. It does not exist. The `build:pages` script copies `index.html` to `404.html`, so GitHub Pages serves the app anyway and the router reads the URL. Chapter 12 explains this in detail. Phase 10 has a task to verify it once routes exist.

---

## Pitfalls

- **`href` instead of `routerLink`**: full reload, state lost.
- **Wrong route order**: `:id` before `new`, or `**` not last.
- **Forgetting `pathMatch: 'full'`** on the redirect from `''`: an empty `prefix` path matches every URL, so the router rejects this configuration with an error.
- **Forgetting `withComponentInputBinding()`**: inputs stay `undefined` with no error.
- **Importing a lazy component directly somewhere else**: it ends up in the main bundle and is no longer lazy.

## Try it yourself

1. Add the route table with `''` → `tasks`, the lazy `tasks` and `projects` routes, and `**`.
2. Add the navigation with `routerLinkActive`. Check `aria-current` in the Elements panel.
3. Run `npm run build` and find the lazy chunks in the output. Then watch them load in the Network tab.
4. Add `/tasks/:id` with `withComponentInputBinding()` and show the id in the page.
5. Write `taskExistsGuard`. Visit `/tasks/nope` and watch the redirect.
6. Write the resolver and see the task arrive as an input.
7. Add `withViewTransitions()` and watch the pages cross-fade.

## Further reading

- [Routing overview](https://angular.dev/guide/routing)
- [Define routes](https://angular.dev/guide/routing/define-routes) and [lazy loading](https://angular.dev/guide/routing/define-routes#lazily-loaded-components-and-routes)
- [Route guards](https://angular.dev/guide/routing/route-guards)
- [Data resolvers](https://angular.dev/guide/routing/data-resolvers)
- [Read route state (component input binding)](https://angular.dev/guide/routing/read-route-state)
