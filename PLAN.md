# Angular Tasklist — Study Plan

The goal is to learn Angular's main features by building one app, a task list, step by step. Each phase adds one group of Angular concepts and ends with something that runs.

## Stack

| Concern        | Choice                                                        |
| -------------- | ------------------------------------------------------------- |
| Framework      | Latest stable Angular (standalone components, no NgModules)   |
| Reactivity     | Signals (`signal`, `computed`, `effect`, `linkedSignal`, `resource`) + RxJS where it fits (HTTP, streams) |
| Change detection | Zoneless (the default in new projects since Angular 21)     |
| Styling        | SCSS (optionally Angular Material / CDK in phase 8)           |
| Backend (fake) | `json-server` serving `db.json` (a real REST API without writing one) |
| Tests          | Vitest (the CLI default) + Angular Testing utilities; Playwright for e2e |
| Tooling        | Angular CLI, ESLint (`ng add @angular-eslint/schematics`), Prettier |

## Domain model

```ts
type Priority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  priority: Priority;
  dueDate?: string;      // ISO date
  tags: string[];
  projectId: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
}
```

## Target folder structure

```
src/app/
  core/            # singletons: services, interceptors, guards, models
    models/
    services/
    interceptors/
    guards/
  shared/          # reusable UI: components, directives, pipes
    components/
    directives/
    pipes/
  features/
    tasks/         # task list, task detail, task form (lazy loaded)
    projects/      # project management (lazy loaded)
    auth/          # fake login page
  app.config.ts    # providers (router, http, etc.)
  app.routes.ts
```

---

## Phases

Each phase lists the **Angular concepts** it covers, **what to build**, and **done when** criteria.

### Phase 0 — Setup and tooling

- **Concepts:** Angular CLI, project structure, `app.config.ts`, `bootstrapApplication`, dev server, build.
- **Build:**
  - `npm install -g @angular/cli` then `ng new angular-tasklist --style=scss --routing` (in this repo).
  - Add ESLint and Prettier.
  - Read through the generated files: `main.ts`, `app.config.ts`, `app.ts`, `angular.json`.
- **Done when:** `ng serve` shows the app and `ng test` / `ng lint` pass.

### Phase 1 — Components and templates (static UI)

- **Concepts:** standalone components, template syntax, interpolation, property/event/two-way binding, built-in control flow (`@if`, `@for` with `track`, `@switch`, `@let`), class/style bindings, component styles and view encapsulation.
- **Build:**
  - `TaskListComponent` that renders a hard-coded array of tasks.
  - `TaskItemComponent` for one row (title, priority badge, checkbox).
  - An empty-state message with `@if` / `@else`, or the `@empty` block of `@for`.
- **Done when:** a static list renders, and the done/priority styles change with the data.

### Phase 2 — Component communication and signals

- **Concepts:** `input()` / `input.required()`, `output()`, `model()` (two-way binding), `signal`, `computed`, `effect`, `linkedSignal`, content projection (`<ng-content>`, multi-slot), `viewChild()` / `contentChild()`, lifecycle hooks (`ngOnInit`, `ngOnDestroy`, `afterNextRender`), `DestroyRef`.
- **Build:**
  - `TaskItemComponent` emits `toggle` and `delete` events, and the parent updates its state signal.
  - Counters with `computed`: total, done, pending, overdue.
  - A filter bar (All / Pending / Done) that uses `model()` to bind the filter value both ways.
  - A reusable `CardComponent` with `<ng-content select="[card-header]">`.
- **Done when:** you can add, toggle and delete tasks in memory, and the counters update on their own.

### Phase 3 — Services and dependency injection

- **Concepts:** `@Injectable({ providedIn: 'root' })`, `inject()`, provider scopes (root, component, route), `InjectionToken`, `useValue` / `useFactory` / `useClass`, hierarchical injectors.
- **Build:**
  - `TaskStore` service that keeps the state in signals (`tasks`, `filter`, `filteredTasks`) and exposes methods (`add`, `toggle`, `remove`, `update`).
  - An `APP_CONFIG` `InjectionToken` with the API base URL.
  - A `StorageService` behind an abstract class, so you can swap `LocalStorageService` for an in-memory one in tests.
- **Done when:** components contain no business logic, and state survives a page reload (via localStorage).

### Phase 4 — Routing

- **Concepts:** `provideRouter`, route config, `routerLink` / `routerLinkActive`, route params as inputs (`withComponentInputBinding()`), child routes, lazy loading (`loadComponent`, `loadChildren`), functional guards (`canActivate`, `canDeactivate`), resolvers, wildcard / 404 route, `withViewTransitions()`.
- **Build:**
  - `/tasks` (list), `/tasks/new`, `/tasks/:id` (detail/edit), `/projects`, `/login`, `**` (not found).
  - Lazy load the `tasks` and `projects` features.
  - `authGuard` that redirects to `/login` (fake auth stored in a signal).
  - `unsavedChangesGuard` (`canDeactivate`) on the task form.
- **Done when:** navigation works, deep links work, and the network tab shows the lazy chunks loading.

### Phase 5 — Forms

- **Concepts:** Reactive forms (`FormGroup`, `FormControl`, `FormArray`, `NonNullableFormBuilder`), typed forms, built-in and custom validators (sync and async), cross-field validation, showing errors, `ControlValueAccessor` for a custom form control. Optional: try the newer **Signal Forms** API and compare.
- **Build:**
  - Task form: title (required, min length), description, priority (select), due date (custom validator: not in the past), tags (`FormArray`).
  - Async validator: the title must be unique within the project.
  - A custom `PrioritySelectorComponent` that implements `ControlValueAccessor`.
  - A small template-driven form (for example the search box with `ngModel`) to see the difference.
- **Done when:** create and edit share one form, validation messages show up, and the save button is disabled while the form is invalid.

### Phase 6 — HTTP and RxJS

- **Concepts:** `provideHttpClient(withInterceptors(...))`, `HttpClient`, typed responses, functional interceptors (auth header, error handling, loading indicator), RxJS operators (`switchMap`, `debounceTime`, `distinctUntilChanged`, `catchError`, `retry`), signal interop (`toSignal`, `toObservable`, `rxResource` / `httpResource`).
- **Build:**
  - Run `json-server` with `db.json` (`/tasks`, `/projects`), and add an `npm run api` script.
  - Change `TaskStore` to load and save through `TaskApiService`.
  - A search box with debounce that queries `/tasks?q=`.
  - A global loading bar and error toasts driven by interceptors.
  - Optimistic toggle with rollback on error.
- **Done when:** all CRUD goes through the API, and errors and loading states show up in the UI.

### Phase 7 — Directives and pipes

- **Concepts:** attribute directives (`host` bindings, `HostListener`-style events in `host`), structural directives (`TemplateRef`, `ViewContainerRef`), directive composition (`hostDirectives`), pure and impure pipes, built-in pipes (`date`, `async`, `titlecase`, `json`).
- **Build:**
  - `appHighlightOverdue` directive that colors overdue tasks.
  - `appAutofocus` directive for the form's first field.
  - `*appHasRole="'admin'"` structural directive.
  - `relativeDate` pipe ("in 2 days", "yesterday") and a `priorityLabel` pipe.
- **Done when:** the directives and pipes live in `shared/` and are reused in at least two places.

### Phase 8 — UI polish (optional libraries)

- **Concepts:** Angular CDK (drag and drop, overlay, a11y), Angular Material or a headless approach, `@defer` blocks (`on viewport`, `on idle`, `@placeholder`, `@loading`), animations.
- **Build:**
  - Reorder tasks with CDK `DragDropModule`, and persist the order.
  - Confirmation dialog before delete.
  - `@defer (on viewport)` for a heavy "statistics" panel (a chart of done vs. pending per project).
  - Dark/light theme toggle backed by a signal.
- **Done when:** the app feels finished and Lighthouse accessibility is above 90.

### Phase 9 — Testing

- **Concepts:** `TestBed`, component harnesses, testing signals and `computed`, `HttpTestingController` (`provideHttpClientTesting`), testing guards, interceptors and pipes, e2e with Playwright.
- **Build:**
  - Unit tests for `TaskStore` (pure logic), `relativeDate` pipe, `authGuard`, and the error interceptor.
  - Component tests for `TaskItemComponent` (inputs and outputs) and the task form (validation).
  - One e2e test: log in, create a task, mark it done, delete it.
- **Done when:** `ng test` passes with meaningful coverage of `core/` and `shared/`, and the e2e test passes in CI.

### Phase 10 — Advanced and production

- **Concepts:** SSR and hydration (`ng add @angular/ssr`, incremental hydration), i18n (`$localize`, `ng extract-i18n`), environment config, budgets and bundle analysis, `ChangeDetectionStrategy.OnPush` reasoning (even when zoneless), PWA (`ng add @angular/pwa`), deployment (GitHub Pages / Firebase / Vercel), GitHub Actions CI (lint, test, build).
- **Build:**
  - CI workflow in `.github/workflows/ci.yml`.
  - Translate the UI into a second language (for example pt-BR and en).
  - Deploy a live demo.
- **Done when:** every push runs CI and there is a public URL.

---

## Concept checklist

Mark each item as you learn it.

- [ ] Standalone components and templates
- [ ] Control flow (`@if`, `@for`, `@switch`, `@let`, `@defer`)
- [ ] Signals: `signal`, `computed`, `effect`, `linkedSignal`, `resource`
- [ ] Signal-based `input` / `output` / `model` / `viewChild`
- [ ] Content projection
- [ ] Lifecycle hooks and `DestroyRef`
- [ ] Services, `inject()`, providers, `InjectionToken`
- [ ] Router: lazy loading, guards, resolvers, input binding
- [ ] Reactive forms, typed forms, custom validators, `ControlValueAccessor`
- [ ] Template-driven forms
- [ ] `HttpClient`, interceptors, RxJS operators, RxJS ↔ signals interop
- [ ] Custom directives (attribute and structural) and pipes
- [ ] Angular CDK / Material
- [ ] Unit, component and e2e testing
- [ ] SSR / hydration, i18n, PWA, CI/CD

## Working approach

- One Git branch and pull request per phase (`phase-01-components`, ...). The PR description summarizes what you learned.
- Keep a `NOTES.md` with questions, gotchas and links to the docs at https://angular.dev.
- Before each phase, do the matching tutorial or guide on angular.dev, then apply it here.
