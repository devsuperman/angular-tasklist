# Tasks — Angular Tasklist

The work split into phases. Each phase covers one group of Angular concepts and ends with something that runs. Feature IDs (F1, F2, ...) refer to [BUSINESS_PLAN.md](BUSINESS_PLAN.md); technical decisions are in [TECH_STACK.md](TECH_STACK.md).

Workflow for each phase: read the matching chapter in [docs/learn](learn/README.md) and the guide on angular.dev → create a `phase-XX-...` branch → do the tasks → write what you learned in `NOTES.md` → open a pull request.

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

### Phase 0.5 — Deploy to GitHub Pages

**Concepts:** static hosting, `--base-href`, SPA fallback, GitHub Actions.

Deploying early means every finished phase goes live at https://devsuperman.github.io/angular-tasklist/.

- [x] Add `"build:pages"`: `ng build --base-href /angular-tasklist/`, then copy `index.html` to `404.html`
- [x] Deploy workflow (`.github/workflows/deploy.yml`) to GitHub Pages on push to `main` (see "Deployment" in TECH_STACK.md)
- [x] Add the demo link and a deploy badge to `README.md`
- [ ] Set **Settings → Pages → Source** to **GitHub Actions**

**Done when:** a push to `main` updates https://devsuperman.github.io/angular-tasklist/.

### Phase 1 — Components and templates (F1)

**Concepts:** standalone components, interpolation, property/event binding, `@if`, `@for` with `track`, `@switch`, `@let`, class/style bindings, component styles.

- [x] Create the `Task` and `Project` models in `core/models/`
- [x] `TaskListComponent` renders a hard-coded array of tasks
- [x] `TaskItemComponent` shows title, priority badge, due date and a checkbox
- [x] Empty state with `@empty` (in `@for`) or `@if` / `@else`
- [x] Priority badge styled with `@switch` or class bindings

**Done when:** a static list renders, and the styles change with the data.

### Phase 2 — Component communication and signals (F3, F4, F7)

**Concepts:** `input()`, `output()`, `model()`, `signal`, `computed`, `effect`, `linkedSignal`, `<ng-content>`, `viewChild()`, lifecycle hooks, `DestroyRef`.

- [x] `TaskItemComponent` takes the task as `input.required()` and emits `toggle` and `delete`
- [x] The parent holds tasks in a `signal` and updates it on events
- [x] Counters with `computed`: total, done, pending, overdue
- [x] `FilterBarComponent` with `model()` for the filter value (All / Pending / Done)
- [x] Reusable `CardComponent` with multi-slot `<ng-content>`
- [x] An "add task" input that uses `viewChild()` to focus the field
- [x] Log state changes with `effect` (then remove it, and understand when _not_ to use effects)

**Done when:** you can add, toggle and delete tasks in memory, and the counters update on their own.

### Phase 3 — Services and dependency injection

**Concepts:** `@Injectable`, `inject()`, provider scopes, `InjectionToken`, `useValue` / `useFactory` / `useClass`.

- [x] Move state and logic into `TaskStore` (signals + `add`, `toggle`, `remove`, `update` methods)
- [x] Expose read-only signals (`asReadonly()`, `computed`)
- [x] `APP_CONFIG` `InjectionToken` with the storage key and the seed data URL
- [x] Abstract `StorageService` with a `LocalStorageService` implementation
- [x] Try a component-level provider and see that each instance gets its own service

**Done when:** components contain no business logic, and tasks survive a page reload.

---

## Milestone 2 — Full MVP

### Phase 4 — Routing

**Concepts:** `provideRouter`, `routerLink`, `routerLinkActive`, `withComponentInputBinding()`, lazy loading, functional guards, resolvers, wildcard route, `withViewTransitions()`.

- [x] Set up the routes listed in TECH_STACK.md
- [x] Lazy load `tasks` and `projects` with `loadChildren` / `loadComponent`
- [x] Redirect `''` to `/tasks`
- [x] `taskExistsGuard` (functional `canActivate`) that redirects to `/tasks` when the id is unknown
- [x] `/tasks/:id` gets `id` as a component input
- [x] Resolver that loads the task before the detail page opens
- [x] 404 page for `**`
- [x] Navigation header with `routerLinkActive`

**Done when:** deep links work, and the network tab shows the lazy chunks loading.

### Phase 5 — Forms (F2, F6)

**Concepts:** reactive forms, typed forms, `NonNullableFormBuilder`, `FormArray`, validators (sync, async, cross-field), `ControlValueAccessor`, template-driven forms.

- [x] Task form: title (required, min length), description, priority, due date, project
- [x] Tags with `FormArray` (add and remove)
- [x] Custom validator: due date is not in the past
- [x] Async validator: title is unique within the project
- [x] Show validation messages, and disable save while the form is invalid
- [x] One form for both create and edit
- [x] `PrioritySelectorComponent` implementing `ControlValueAccessor`
- [x] `unsavedChangesGuard` (`canDeactivate`) for a dirty form
- [x] Project form (template-driven with `ngModel`) to compare the two approaches
- [ ] Optional: rebuild the task form with Signal Forms and compare

**Done when:** you can create and edit tasks and projects with validation.

### Phase 6 — Persistence, HTTP and RxJS (F5)

**Concepts:** `localStorage`, `provideHttpClient`, `HttpClient`, functional interceptors, `fromEvent`, `debounceTime`, `distinctUntilChanged`, `catchError`, `toSignal`, `toObservable`, `httpResource` / `rxResource`.

- [x] `TaskRepository` and `ProjectRepository` with typed methods, saving through `StorageService` (see "Storage" in TECH_STACK.md). Done as one `DataRepository`, since all data shares one key (chapter 8 allows either)
- [x] Save a schema `version`, and fall back to seed data when stored JSON is missing or invalid
- [x] `TaskStore` and `ProjectStore` load from and save through the repositories
- [x] Create `public/seed.json` and load it with `httpResource` on the first visit (loading, error and value states)
- [x] Interceptor for the seed request: global error handling (toast) and a loading bar
- [x] Search box: `toObservable` → `debounceTime` → `distinctUntilChanged` → `toSignal`, filtering in memory
- [x] Keep two open tabs in sync with `fromEvent(window, 'storage')`
- [x] Handle a full storage (`QuotaExceededError`) with a clear message

**Done when:** data survives a reload, a first visit shows the seed data, and two tabs stay in sync.

### Phase 7 — Directives and pipes

**Concepts:** attribute directives, `host` bindings, structural directives (`TemplateRef`, `ViewContainerRef`), `hostDirectives`, pure pipes, built-in pipes.

- [x] `appHighlightOverdue` attribute directive
- [x] `appAutofocus` directive for the form's first field
- [x] `*appFeatureFlag` structural directive that shows content only when a flag in `APP_CONFIG` is on
- [x] `relativeDate` pipe ("in 2 days", "yesterday")
- [x] `priorityLabel` pipe
- [x] Use the built-in `date` and `titlecase` pipes

**Done when:** directives and pipes live in `shared/` and are used in at least two places.

---

## Milestone 3 — Polished product

### Phase 8 — UI polish (F8, F9, F10)

**Concepts:** Angular CDK, Angular Material, `@defer`, animations, accessibility.

- [ ] Reorder tasks with CDK drag and drop, and save `order` to storage
- [ ] Confirmation dialog before delete (Material dialog or CDK overlay)
- [ ] Statistics panel inside `@defer (on viewport)` with `@placeholder` and `@loading`
- [ ] Dark/light theme toggle backed by a signal and saved to storage
- [ ] Responsive layout for mobile
- [ ] Accessibility pass: labels, keyboard navigation, focus states

**Done when:** Lighthouse accessibility is above 90.

### Phase 9 — Testing

**Concepts:** `TestBed`, testing signals, component harnesses, `provideHttpClientTesting` / `HttpTestingController`, Playwright.

- [ ] Unit tests: `TaskStore`, repositories (with an in-memory `StorageService`), `relativeDate` pipe, `taskExistsGuard`, error interceptor
- [ ] Component tests: `TaskItemComponent` (inputs and outputs), task form (validation)
- [ ] Seed loading test with `HttpTestingController`
- [ ] E2E: create a task → mark it done → reload and check it is still done → delete it

**Done when:** `ng test` and the e2e suite pass.

---

## Milestone 4 — Production

### Phase 10 — Advanced and production (F11, F12)

**Concepts:** i18n, PWA, budgets, CI/CD, static hosting on GitHub Pages.

- [ ] GitHub Actions workflow (`.github/workflows/ci.yml`): lint, test, build on every push and pull request
- [ ] Check that a deep link (for example `/angular-tasklist/projects`) loads on refresh, once routing exists (Phase 4)
- [ ] i18n with `$localize`: English and pt-BR (one build per language, or runtime loading; check it works under the Pages base path)
- [ ] PWA with `ng add @angular/pwa` (check the service worker scope under `/angular-tasklist/`)
- [ ] Check bundle budgets and analyze the bundle

**Done when:** every push and pull request runs CI, and the deployed app works offline and in both languages.
