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

## Phase 6 — Persistence, HTTP and RxJS

- **One repository.** All data is under one key, so `DataRepository` (`load()` / `save()`) handles tasks and projects together. With separate task and project repositories, each would have to read the other's half before writing. It validates what it reads (`isSeedData`), has a `migrate()` hook for future schema versions, and turns `QuotaExceededError` into a `StorageFullError`.
- **Where the data starts.** `InitialData` reads the saved data once. Only when there is none does it load `seed.json` with `httpResource`: a url of `undefined` means "do not request". The `parse` option validates the JSON, because `http.get<T>()` is only a promise to the compiler.
- The stores' state is a `linkedSignal` over `InitialData.value()`: it starts from the saved data or the seed, and stays writable for `add`, `toggle` and the rest.
- **Saving.** `PersistenceService` has one `effect` that saves `{ tasks, projects }` whenever either changes (option B in chapter 8). It skips saving while the seed is loading, otherwise an empty list would be saved over the coming seed. `provideAppInitializer` creates the service at startup, since nothing else injects it.
- **Interceptors.** `loadingInterceptor` counts requests in `LoadingService` and stops in `finalize`. `errorInterceptor` uses `catchError` to show a toast, then rethrows, so the resource still ends up in its error state and the list shows "Could not load the demo data".
- **Search** is `query` (signal) → `toObservable` → `map` / `debounceTime(250)` / `distinctUntilChanged` → `toSignal`. Signals have no idea of time; RxJS does. The filtering itself is a `computed`, in memory.
- **Tabs in sync.** `fromEvent(window, 'storage')` + `filter` + `takeUntilDestroyed`. The event only fires in the _other_ tabs. Re-saving the received data is harmless: writing an equal value fires no new event.
- Tested by hand in a browser: first visit loads 7 seed tasks, a toggled task survives a reload, the search waits for the pause, a second tab's new task appears in the first, a broken `seed.json` shows the toast, and a full storage shows the "storage full" message.
- Also added: filtering by project (F4), and a "saved in this browser only" note (a risk listed in BUSINESS_PLAN.md).

## Phase 7 — Directives and pipes

- `HighlightOverdueDirective` (`[appHighlightOverdue]="task.dueDate" [done]="task.done"`) uses the `host` metadata to toggle the `overdue` class. The class is styled in `styles.scss`, because it lands on other components' elements, where component styles would not reach. Used on the task row and on the form's due date input.
- `AutofocusDirective` focuses its element in `afterNextRender`: the DOM exists by then, and it only runs in the browser. Used on the quick-add input and the form's title.
- `FeatureFlagDirective` is **structural**: it injects `TemplateRef` and `ViewContainerRef` and creates the view only when the `APP_CONFIG` flag is on. `*appFeatureFlag="'statistics'"` is sugar for an `<ng-template [appFeatureFlag]>`.
- `RelativeDatePipe` uses `Intl.RelativeTimeFormat` with `inject(LOCALE_ID)` ("in 3 days", "yesterday", "in 2 months"), and takes `today` as an optional argument so tests can pin the date. It is pure: it only runs again when its inputs change.
- `PriorityLabelPipe` replaced the `@switch` in the badge and in the priority selector. The badge color is now a class binding: `class="badge" [class]="t.priority"`.
- Built-in pipes: `date` (`'fullDate'` in the due date tooltip, `'medium'` for "Created…") and `titlecase`, chained after `date`. That one earns its place: weekday names are lowercase in Portuguese ("sexta-feira"). Pipes chain left to right: `t.dueDate | date: 'fullDate' : 'UTC' | titlecase`.
- `'UTC'` in the `date` pipe matters: `'2027-01-15'` is parsed as UTC midnight, so without it a user west of UTC would see January 14.

## Phase 8 — UI polish

- **CDK only, no Material.** `@angular/cdk` gives the behavior (drag and drop, dialog, focus trap, overlay) and the app keeps its own look. The overlay CSS comes from `@use '@angular/cdk/overlay-prebuilt.css'` in `styles.scss`.
- **Drag and drop:** `cdkDropList` / `cdkDrag` / `cdkDragHandle`. `drop()` copies the visible list, applies `moveItemInArray`, and calls `TaskStore.reorder(ids)`. `reorder` only reshuffles the slots the visible tasks already had, so tasks hidden by a filter stay where they are. The persistence effect saves the new `order`.
- **Keyboard alternative:** CDK drag and drop has no keyboard support, so the handle is a `<button>` that moves the task with the up and down arrow keys and keeps the focus on itself afterwards. It can be turned off with the `dragAndDrop` flag in `APP_CONFIG`.
- **Confirmation dialog:** `ConfirmService.confirm()` opens `ConfirmDialogComponent` with the CDK `Dialog` (`role: 'alertdialog'`) and returns `Observable<boolean>`. It is used for deleting tasks and projects, and by `unsavedChangesGuard`, since a guard may return an Observable. Focus trap, Escape and focus restore come from the CDK.
- **Statistics panel (F9):** `@defer (on viewport)` with `@placeholder (minimum 300ms)`, `@loading (after 150ms; minimum 400ms)` and `@error`, inside `*appFeatureFlag="'statistics'"`. The build output shows a separate `statistics-panel` chunk. The chart is a real `<table>`, so screen readers get the numbers. Its two colors are slots 1 and 2 of a palette checked for color-blind separation and contrast, with a dark-mode step of each.
- **Theme (F10):** `ThemeService` holds a `signal<Theme>`; an `effect` writes `data-theme` on `<html>` and saves the choice. The first value comes from storage, then `prefers-color-scheme`. Dark mode only redefines the CSS custom properties.
- **Animations:** `animate.enter="fade-in"` / `animate.leave="fade-out"` on list items (plain CSS classes, no animations package), all switched off under `prefers-reduced-motion`, along with the view transitions.
- **Accessibility:** a skip link, `:focus-visible` outlines, labels for every control, `aria-pressed` on toggle buttons, and wrapping rows on mobile (375 px wide has no horizontal scroll). Lighthouse accessibility: **100** on `/tasks`, `/projects` and `/tasks/new`.

## Phase 9 — Testing

- **53 unit and component tests** (Vitest via `ng test`) in 12 files:
  - `TaskStore`: add, toggle, counters, overdue, update, remove, `removeByProject`, `reorder` (hidden tasks keep their slots), loading the seed with `HttpTestingController`, a failed seed, and a seed with the wrong shape;
  - `DataRepository`: round trip with the version, `null` for invalid JSON, missing version and broken tasks (`it.each`), and `StorageFullError` from a `QuotaExceededError`;
  - pipes, validators (`notInThePast` with `vi.useFakeTimers`, the cross-field and async validators), `taskExistsGuard`, both interceptors, `FeatureFlagDirective`, and the provider scopes from Phase 3;
  - components: `TaskItemComponent` (inputs with `componentRef.setInput`, outputs with `subscribe`, the overdue class) and `TaskFormPage` (messages, async validator, create, edit and `hasUnsavedChanges`).
- Every test that touches storage gets `MemoryStorageService` and a test `APP_CONFIG`, so tests never read or write real `localStorage`.
- `RelativeDatePipe` calls `inject(LOCALE_ID)`, so its test creates it inside `TestBed.runInInjectionContext`. That made a `pt-BR` test easy: `'amanhã'`.
- Seed loading: `TestBed.tick()` lets the resource send its request, `http.expectOne('seed.json').flush(...)` answers it, and `ApplicationRef.whenStable()` waits for the value to land.
- **E2E (Playwright):** `npm run e2e` builds with `build:pages` and serves `dist/` under `/angular-tasklist/` with a tiny server that answers unknown paths with `404.html` and status 404, just like GitHub Pages. The tests cover the first visit (seed), create → done → reload → still done → delete (through the dialog), deep links on refresh, and the debounced search.
