# Notes

What I learned in each phase.

## Phase 0 — Setup and tooling

- `ng new` (Angular 22) creates a standalone, zoneless app with no NgModules. Vitest is the default test runner and Prettier is configured out of the box.
- `src/main.ts` calls `bootstrapApplication(App, appConfig)`: the root component plus a list of app-wide providers.
- `src/app/app.config.ts` holds those providers. Right now: `provideBrowserGlobalErrorListeners()` and `provideRouter(routes)`. HTTP, interceptors and so on will be added here later.
- `src/app/app.ts` is the root component. `templateUrl` and `styleUrl` point to `app.html` and `app.scss`; `imports` lists what the template uses (`RouterOutlet`).
- `angular.json` defines the `build`, `serve`, `test` and `lint` targets. `ng add angular-eslint` added the `lint` target and `eslint.config.js` (flat config).
- `eslint-config-prettier` is last in `eslint.config.js` so ESLint does not fight Prettier over formatting.
- The Angular 22 CLI needs Node 22.22.3+ or 24.15+.
- Folder layout: `core/` (singletons, models, guards, interceptors), `shared/` (reusable components, directives, pipes), `features/` (lazy-loaded pages). Empty folders hold a `.gitkeep` until they get real files.

## Phase 1 — Components and templates

- The model comes first: `Task` and `Project` are interfaces in `core/models/`, because the data comes from JSON (plain objects, not class instances). `Priority` is a union type, so the template type checker rejects unknown values.
- `TaskListComponent` holds a hard-coded array in a `signal` and renders it with `@for (...; track task.id)`. `@empty` shows the empty state without an extra `@if`.
- `TaskItemComponent` renders one row. `@let t = task();` reads the input once and gives the template a short name.
- The priority badge uses `@switch`; the "done" style uses `[class.done]`. `[attr.aria-label]` is needed because ARIA attributes have no DOM property.
- Component styles are scoped to the component. Colors are CSS custom properties in `styles.scss`, so a dark theme later only has to redefine the tokens.

## Phase 2 — Component communication and signals

- `TaskItemComponent` takes `task = input.required<Task>()` and emits `toggleDone` and `remove` with `output<string>()`. The names avoid native DOM event names (`toggle`, `delete`-like names trip `@angular-eslint/no-output-native`).
- The list keeps tasks in a `signal` and changes them with `update`, always returning a **new** array (and a new object for the changed task). Mutating in place would not notify anyone.
- Counters are `computed`: total, done, pending and overdue. They are lazy and cached, and update by themselves when `tasks` changes.
- `FilterBarComponent` exposes `status = model<StatusFilter>('all')`. The parent binds it with `[(status)]="filter"`, the "banana in a box" two-way binding, and `visibleTasks` is a `computed` that reads `filter()`.
- `CardComponent` has three `<ng-content>` slots: `[card-title]`, the default body and `[card-actions]`.
- `AddTaskComponent` uses `viewChild.required('titleInput')` to clear and focus the input after adding.
- I logged `tasks()` with an `effect`, saw it run once at start and once per change, then removed it. Effects are for syncing with the outside world (storage, DOM APIs), not for deriving state: that is what `computed` is for.
- "Overdue" compares ISO date strings, using the **local** date (`todayIso()`), not `toISOString()` (which is UTC and can be off by a day).

## Phase 3 — Services and dependency injection

- State and rules moved to `TaskStore` and `ProjectStore` (`core/services/`). Components only `inject()` a store, read its signals and call its methods.
- The stores keep a private writable `signal` and expose `asReadonly()` and `computed` values. `store.tasks.set([])` from a component no longer compiles.
- `APP_CONFIG` is an `InjectionToken<AppConfig>` with the storage key, the seed URL and feature flags. It has a default `factory`, and `app.config.ts` also provides it with `useValue`.
- `StorageService` is an **abstract class** (interfaces vanish at runtime, so they cannot be DI tokens). `LocalStorageService` and `MemoryStorageService` extend it. `app.config.ts` uses `useFactory: storageFactory`, which falls back to memory when `localStorage` throws (private mode).
- For now each store saves its own key with an `effect`, so tasks survive a reload. Phase 6 replaces this with a repository and one versioned key.
- The app test broke with `NG0201: No provider found for StorageService`. An abstract class has no `providedIn`, so every injector that needs it (including `TestBed`) must provide it. The test now uses `MemoryStorageService`.
- `core/services/di-scopes.spec.ts` shows provider scopes: with `providedIn: 'root'` two components share one instance; with `providers: [CounterService]` in the component, each instance gets its own.

## Phase 4 — Routing

- `app.routes.ts`: `''` redirects to `tasks` (`pathMatch: 'full'`, or every URL would match the empty prefix). `tasks` uses `loadChildren` (a lazy group of routes in `tasks.routes.ts`); `projects` and `**` use `loadComponent`. The build output shows one lazy chunk per route group.
- `withComponentInputBinding()` passes route params and resolver data to component inputs: `TaskFormPage` gets `id` from `/tasks/:id` and `task` from the resolver's `task` key.
- `taskExistsGuard` is a plain function (`CanActivateFn`). It returns `true` or a `UrlTree`; returning `router.createUrlTree(['/tasks'])` redirects without a separate `navigate()` call.
- `taskResolver` (`ResolveFn<Task | undefined>`) reads the task from the store before the page opens.
- `withViewTransitions()` animates route changes with the browser's View Transitions API (and does nothing where it is not supported).
- The header uses `routerLinkActive="active"` plus `ariaCurrentWhenActive="page"`, so screen readers also know which link is current.
- Every route has a `title`; the router sets `document.title` from it.
- The app test now needs `provideRouter([])` because the header uses `RouterLink`.

## Phase 5 — Forms

- `TaskFormPage` is a **typed reactive form** built with `NonNullableFormBuilder`, so `getRawValue()` returns `{ title: string; ... }` with no `null`s, and `reset()` goes back to the initial values.
- One form for create and edit. An `effect` fills the form when the resolved `task` input arrives, wrapped in `untracked` so the form calls inside it don't become dependencies.
- Validators:
  - built-in: `required`, `minLength`, `maxLength`;
  - custom sync: `notInThePast` (`shared/validators/not-in-the-past.ts`). In the form it only runs on a **dirty** control, so an overdue task can still be edited without changing its date;
  - async: `uniqueTitleValidator`, unique title within the project. The form is `pending` while it runs, and the title is re-validated when the project changes (`valueChanges` + `takeUntilDestroyed(DestroyRef)`);
  - cross-field: `highPriorityNeedsDate` on the group.
- Tags use a `FormArray`. Track the `@for` by the control object, since index tracking breaks when a tag in the middle is removed.
- `PrioritySelectorComponent` implements `ControlValueAccessor` (`writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`) and registers itself with `NG_VALUE_ACCESSOR` + `forwardRef`. After that, `formControlName="priority"` just works on it.
- `unsavedChangesGuard` (`CanDeactivateFn<HasUnsavedChanges>`) asks before leaving a dirty form. The page sets `saved = true` before navigating, or the guard would block its own redirect.
- `ProjectFormComponent` is **template-driven** (`ngModel` on signals, `#projectForm="ngForm"`). Its fields are `linkedSignal`s: they start from the `project` input and stay writable. Compared with reactive forms, it's less code for a tiny form, but the validation lives in the HTML and is harder to test.
- Projects: create, rename (inline, reusing the same form) and delete. Deleting a project also deletes its tasks, after a confirmation, and the last project cannot be deleted.
- Not done yet: the optional Signal Forms version.
