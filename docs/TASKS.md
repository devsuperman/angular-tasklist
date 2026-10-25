# Tasks — Angular Tasklist

The work split into phases. Each phase covers one group of Angular concepts and ends with something that runs. Feature IDs (F1, F2, ...) refer to [BUSINESS_PLAN.md](BUSINESS_PLAN.md); technical decisions are in [TECH_STACK.md](TECH_STACK.md).

Workflow for each phase: read the matching guide on angular.dev → create a `phase-XX-...` branch → do the tasks → write what you learned in `NOTES.md` → open a pull request.

---

## Milestone 1 — Working prototype

### Phase 0 — Setup and tooling

**Concepts:** Angular CLI, project structure, `bootstrapApplication`, `app.config.ts`.

- [x] Install the Angular CLI: `npm install -g @angular/cli`
- [x] Create the project in this repo: `ng new angular-tasklist --style=scss --routing`
- [x] Add ESLint (`ng add @angular-eslint/schematics`) and Prettier
- [x] Read the generated files: `main.ts`, `app.config.ts`, `app.ts`, `angular.json`
- [x] Create the `core/`, `shared/` and `features/` folders

**Done when:** `ng serve`, `ng test` and `ng lint` all work.

### Phase 1 — Components and templates (F1)

**Concepts:** standalone components, interpolation, property/event binding, `@if`, `@for` with `track`, `@switch`, `@let`, class/style bindings, component styles.

- [ ] Create the `Task` and `Project` models in `core/models/`
- [ ] `TaskListComponent` renders a hard-coded array of tasks
- [ ] `TaskItemComponent` shows title, priority badge, due date and a checkbox
- [ ] Empty state with `@empty` (in `@for`) or `@if` / `@else`
- [ ] Priority badge styled with `@switch` or class bindings

**Done when:** a static list renders, and the styles change with the data.

### Phase 2 — Component communication and signals (F3, F4, F7)

**Concepts:** `input()`, `output()`, `model()`, `signal`, `computed`, `effect`, `linkedSignal`, `<ng-content>`, `viewChild()`, lifecycle hooks, `DestroyRef`.

- [ ] `TaskItemComponent` takes the task as `input.required()` and emits `toggle` and `delete`
- [ ] The parent holds tasks in a `signal` and updates it on events
- [ ] Counters with `computed`: total, done, pending, overdue
- [ ] `FilterBarComponent` with `model()` for the filter value (All / Pending / Done)
- [ ] Reusable `CardComponent` with multi-slot `<ng-content>`
- [ ] An "add task" input that uses `viewChild()` to focus the field
- [ ] Log state changes with `effect` (then remove it, and understand when _not_ to use effects)

**Done when:** you can add, toggle and delete tasks in memory, and the counters update on their own.

### Phase 3 — Services and dependency injection

**Concepts:** `@Injectable`, `inject()`, provider scopes, `InjectionToken`, `useValue` / `useFactory` / `useClass`.

- [ ] Move state and logic into `TaskStore` (signals + `add`, `toggle`, `remove`, `update` methods)
- [ ] Expose read-only signals (`asReadonly()`, `computed`)
- [ ] `APP_CONFIG` `InjectionToken` with the API base URL
- [ ] Abstract `StorageService` with a `LocalStorageService` implementation
- [ ] Try a component-level provider and see that each instance gets its own service

**Done when:** components contain no business logic, and tasks survive a page reload.

---

## Milestone 2 — Full MVP

### Phase 4 — Routing (F8)

**Concepts:** `provideRouter`, `routerLink`, `routerLinkActive`, `withComponentInputBinding()`, lazy loading, functional guards, resolvers, wildcard route, `withViewTransitions()`.

- [ ] Set up the routes listed in TECH_STACK.md
- [ ] Lazy load `tasks` and `projects` with `loadChildren` / `loadComponent`
- [ ] Fake `AuthService` (logged-in state in a signal) and a `/login` page
- [ ] `authGuard` that redirects to `/login`
- [ ] `/tasks/:id` gets `id` as a component input
- [ ] Resolver that loads the task before the detail page opens
- [ ] 404 page for `**`
- [ ] Navigation header with `routerLinkActive`

**Done when:** deep links work, and the network tab shows the lazy chunks loading.

### Phase 5 — Forms (F2, F6)

**Concepts:** reactive forms, typed forms, `NonNullableFormBuilder`, `FormArray`, validators (sync, async, cross-field), `ControlValueAccessor`, template-driven forms.

- [ ] Task form: title (required, min length), description, priority, due date, project
- [ ] Tags with `FormArray` (add and remove)
- [ ] Custom validator: due date is not in the past
- [ ] Async validator: title is unique within the project
- [ ] Show validation messages, and disable save while the form is invalid
- [ ] One form for both create and edit
- [ ] `PrioritySelectorComponent` implementing `ControlValueAccessor`
- [ ] `unsavedChangesGuard` (`canDeactivate`) for a dirty form
- [ ] Project form (template-driven with `ngModel`) to compare the two approaches
- [ ] Optional: rebuild the task form with Signal Forms and compare

**Done when:** you can create and edit tasks and projects with validation.

### Phase 6 — HTTP and RxJS (F5)

**Concepts:** `provideHttpClient`, `HttpClient`, functional interceptors, `switchMap`, `debounceTime`, `distinctUntilChanged`, `catchError`, `retry`, `toSignal`, `toObservable`, `httpResource` / `rxResource`.

- [ ] Install `json-server`, create `db.json` with seed data, add an `npm run api` script
- [ ] `TaskApiService` and `ProjectApiService` with typed methods
- [ ] `TaskStore` loads and saves through the API
- [ ] Search box: `toObservable` → `debounceTime` → `switchMap` → `toSignal`
- [ ] Load the task detail with `httpResource` (loading, error and value states)
- [ ] Interceptors: auth header, global error handling (toast), loading bar
- [ ] Optimistic toggle with rollback on error

**Done when:** all CRUD goes through the API, and loading and error states show in the UI.

### Phase 7 — Directives and pipes

**Concepts:** attribute directives, `host` bindings, structural directives (`TemplateRef`, `ViewContainerRef`), `hostDirectives`, pure pipes, built-in pipes.

- [ ] `appHighlightOverdue` attribute directive
- [ ] `appAutofocus` directive for the form's first field
- [ ] `*appHasRole` structural directive (for example, hide "delete project" from non-admins)
- [ ] `relativeDate` pipe ("in 2 days", "yesterday")
- [ ] `priorityLabel` pipe
- [ ] Use the built-in `date` and `titlecase` pipes

**Done when:** directives and pipes live in `shared/` and are used in at least two places.

---

## Milestone 3 — Polished product

### Phase 8 — UI polish (F9, F10, F11)

**Concepts:** Angular CDK, Angular Material, `@defer`, animations, accessibility.

- [ ] Reorder tasks with CDK drag and drop, and save `order` through the API
- [ ] Confirmation dialog before delete (Material dialog or CDK overlay)
- [ ] Statistics panel inside `@defer (on viewport)` with `@placeholder` and `@loading`
- [ ] Dark/light theme toggle backed by a signal and saved to storage
- [ ] Responsive layout for mobile
- [ ] Accessibility pass: labels, keyboard navigation, focus states

**Done when:** Lighthouse accessibility is above 90.

### Phase 9 — Testing

**Concepts:** `TestBed`, testing signals, component harnesses, `provideHttpClientTesting` / `HttpTestingController`, Playwright.

- [ ] Unit tests: `TaskStore`, `relativeDate` pipe, `authGuard`, error interceptor
- [ ] Component tests: `TaskItemComponent` (inputs and outputs), task form (validation)
- [ ] API service tests with `HttpTestingController`
- [ ] E2E: log in → create a task → mark it done → delete it

**Done when:** `ng test` and the e2e suite pass.

---

## Milestone 4 — Production

### Phase 10 — Advanced and production (F12, F13)

**Concepts:** SSR and hydration, i18n, PWA, budgets, CI/CD.

- [ ] GitHub Actions workflow (`.github/workflows/ci.yml`): lint, test, build
- [ ] Add SSR with `ng add @angular/ssr` and check hydration
- [ ] i18n with `$localize`: English and pt-BR
- [ ] PWA with `ng add @angular/pwa`
- [ ] Check bundle budgets and analyze the bundle
- [ ] Deploy a public demo

**Done when:** every push runs CI and there is a public URL.
