# Chapter 8 — HTTP, RxJS and persistence

**Phase 6** (F5 · search) · Concepts: the repository pattern, `localStorage`, schema versions, `provideHttpClient`, `HttpClient`, `httpResource` / `resource` / `rxResource`, functional interceptors, Observables and operators (`debounceTime`, `distinctUntilChanged`, `catchError`, `fromEvent`), `toSignal`, `toObservable`, `takeUntilDestroyed`.

This app has **no backend** ([BUSINESS_PLAN.md](../BUSINESS_PLAN.md), out of scope). Data lives in `localStorage`. HTTP is used for one thing: loading `public/seed.json` on the first visit. That is enough to learn `HttpClient`, interceptors and resources, without running a server.

---

## 8.1 Persistence: repositories over `StorageService`

### What

A **repository** is a class that reads and writes one kind of data and hides **how** it is stored.

```
TaskStore ──▶ TaskRepository ──▶ StorageService (abstract) ──▶ LocalStorageService ──▶ localStorage
```

### Why

- The store thinks in `Task[]`, not in JSON strings and keys.
- Parsing, validation, schema versions and migrations live in **one** place.
- Tests give the repository a `MemoryStorageService` (Chapter 5) and never touch real `localStorage`.
- If one day the data moves to IndexedDB or a server, only the repository changes.

### How it will be applied here

🔵 **Planned (Phase 6)**: all data is under one key, with a version ([TECH_STACK.md](../TECH_STACK.md), Storage):

```ts
// core/services/data-repository.ts
const CURRENT_VERSION = 1;

interface StoredData {
  version: number;
  tasks: Task[];
  projects: Project[];
}

@Injectable({ providedIn: 'root' })
export class DataRepository {
  private readonly storage = inject(StorageService);
  private readonly key = inject(APP_CONFIG).storageKey;

  /** Returns the saved data, or null when there is none or it cannot be used. */
  load(): StoredData | null {
    const raw = this.storage.getItem(this.key);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as StoredData;
      if (typeof data?.version !== 'number' || !Array.isArray(data.tasks)) return null;
      return migrate(data);
    } catch {
      return null; // invalid JSON: fall back to seed data
    }
  }

  save(data: Omit<StoredData, 'version'>): void {
    try {
      this.storage.setItem(this.key, JSON.stringify({ version: CURRENT_VERSION, ...data }));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new StorageFullError();
      }
      throw error;
    }
  }
}

function migrate(data: StoredData): StoredData {
  // Example: version 1 → 2 added `order`
  // if (data.version === 1) data = { ...data, version: 2, tasks: data.tasks.map((t, i) => ({ ...t, order: i })) };
  return data;
}
```

`TaskRepository` and `ProjectRepository` from TASKS.md can each wrap one part of this, or you can keep one `DataRepository`; both are fine. What matters is that **only** the repositories know about keys and JSON.

### Saving: explicit or with an `effect`?

```ts
// Option A — explicit: save inside each store method
toggle(id: string) {
  this._tasks.update(...);
  this.repository.saveTasks(this._tasks());
}

// Option B — an effect saves whenever the state changes
constructor() {
  effect(() => this.repository.saveTasks(this._tasks()));
}
```

Option B is shorter and cannot forget a method. It is a valid use of `effect`: syncing a signal to **the outside world** (Chapter 3). Option A is easier to follow and to handle errors in. Try one, and write in NOTES.md why you picked it.

---

## 8.2 `HttpClient`

### What

`HttpClient` is Angular's service for HTTP requests. Turn it on in `app.config.ts`:

```ts
provideHttpClient(withFetch(), withInterceptors([loadingInterceptor, errorInterceptor]));
```

Requests return **Observables**. Nothing is sent until something subscribes.

```ts
private readonly http = inject(HttpClient);

loadSeed(): Observable<SeedData> {
  return this.http.get<SeedData>(this.config.seedUrl);
}
```

> `get<SeedData>` is a **promise to the compiler**, not a runtime check. If the JSON has a different shape, TypeScript will not notice. That is why the repository validates what it loads.

### Why for a static file?

It is the real-world path: in another app `seed.json` would be an API. The URL is **relative** (`seed.json`, no leading `/`), so it resolves against `<base href>` and works both locally and under `/angular-tasklist/` on GitHub Pages (Chapter 12).

---

## 8.3 Resources: async data as signals

### What

A **resource** wraps async loading in signals: `value()`, `isLoading()`, `error()`, `hasValue()`, `status()`, plus `reload()`. When the signals it depends on change, it reloads by itself.

| API            | Loader                         | Import                       |
| -------------- | ------------------------------ | ---------------------------- |
| `httpResource` | An HTTP GET built from a URL   | `@angular/common/http`       |
| `resource`     | Any `async` function (Promise) | `@angular/core`              |
| `rxResource`   | Any Observable                 | `@angular/core/rxjs-interop` |

### How it will be applied here

🔵 **Planned (Phase 6)**: load the seed on the first visit.

```ts
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly repository = inject(DataRepository);
  private readonly config = inject(APP_CONFIG);
  private readonly saved = this.repository.load();

  // Only request the seed when nothing was saved. Returning undefined means "do not load".
  readonly seed = httpResource<SeedData>(() => (this.saved ? undefined : this.config.seedUrl));

  private readonly _tasks = linkedSignal(() => this.saved?.tasks ?? this.seed.value()?.tasks ?? []);
  readonly tasks = this._tasks.asReadonly();
  readonly isLoading = this.seed.isLoading;
  readonly loadError = this.seed.error;
  ...
}
```

```html
@if (store.isLoading()) {
  <p>Loading your first tasks…</p>
} @else if (store.loadError()) {
  <p role="alert">Could not load the demo data. You can still add tasks.</p>
} @else {
  <!-- the list -->
}
```

`linkedSignal` (Chapter 3) fits well: the tasks start from the saved data or the seed, and then the user changes them with `set` / `update`.

> `httpResource` is for **reading** data. For writes (POST, PUT, DELETE), call `HttpClient` directly.

`rxResource` looks like this, if you prefer to keep `loadSeed()` as an Observable:

```ts
readonly seed = rxResource({
  params: () => (this.saved ? undefined : this.config.seedUrl),
  stream: ({ params: url }) => this.http.get<SeedData>(url),
});
```

---

## 8.4 Functional interceptors

### What

An **interceptor** is a function that every request passes through. It can change the request, watch the response, or handle errors: a middleware for `HttpClient`.

```ts
// core/interceptors/loading.interceptor.ts
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));
};
```

```ts
// core/interceptors/error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      toast.show(
        error.status === 0 ? 'You seem to be offline.' : `Request failed (${error.status}).`,
      );
      return throwError(() => error); // let the caller (or the resource) still see the error
    }),
  );
};
```

```ts
// LoadingService: a counter in a signal, so parallel requests work
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pending = signal(0);
  readonly isLoading = computed(() => this.pending() > 0);
  start() {
    this.pending.update((n) => n + 1);
  }
  stop() {
    this.pending.update((n) => n - 1);
  }
}
```

The order in `withInterceptors([...])` is the order requests pass through them (responses come back in reverse).

### Why

Cross-cutting concerns (loading bar, error messages, later maybe auth headers or retries) should not be repeated in every service. Write them once. In this app there is one request, but the pattern is the same with a hundred.

---

## 8.5 RxJS in a signal-based app

### What

**RxJS** is a library for **streams** of events: an `Observable` emits values over time, and **operators** transform the stream.

```ts
source$.pipe(
  map((x) => ...),          // transform each value
  filter((x) => ...),       // drop some values
  debounceTime(300),        // wait until values stop for 300 ms
  distinctUntilChanged(),   // skip a value equal to the previous one
  switchMap((x) => ...),    // start a new inner stream, cancel the previous one
  catchError((e) => ...),   // recover from an error
)
```

### Why still RxJS?

Signals hold **current values**. They have no idea of **time**: "wait 300 ms after the user stops typing" or "an event that happens in another tab" are stream problems. The project rule: **signals for state, RxJS for events over time**, and the interop functions to move between them.

| Function                                      | From → to             | Notes                                                      |
| --------------------------------------------- | --------------------- | ---------------------------------------------------------- |
| `toSignal(obs$, { initialValue })`            | Observable → Signal   | Subscribes now; unsubscribes when the context is destroyed |
| `toObservable(sig)`                           | Signal → Observable   | Emits when the signal changes                              |
| `takeUntilDestroyed()`                        | ends a subscription   | Uses `DestroyRef` (Chapter 4)                              |
| `outputFromObservable` / `outputToObservable` | outputs ↔ Observables | Rarely needed                                              |

All in `@angular/core/rxjs-interop`.

### Search with debounce (F5)

🔵 **Planned (Phase 6)**:

```ts
export class TaskListPage {
  private readonly store = inject(TaskStore);

  protected readonly query = signal(''); // bound to the search input
  private readonly debouncedQuery = toSignal(
    toObservable(this.query).pipe(
      map((q) => q.trim().toLowerCase()),
      debounceTime(250),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  protected readonly visibleTasks = computed(() => {
    const q = this.debouncedQuery();
    return this.store.tasks().filter((t) => t.title.toLowerCase().includes(q));
  });
}
```

```html
<label for="search">Search</label>
<input id="search" #search type="search" [value]="query()" (input)="query.set(search.value)" />
```

The flow is: signal (what the user typed) → Observable (to apply time) → signal (for `computed` and the template). The filtering itself is in memory with `computed`, since all data is loaded.

### Keep two tabs in sync

The browser fires a `storage` event in **other** tabs when one tab writes to `localStorage`.

```ts
// in TaskStore's constructor
fromEvent<StorageEvent>(window, 'storage')
  .pipe(
    filter((e) => e.key === this.config.storageKey),
    takeUntilDestroyed(),
  )
  .subscribe(() => {
    const data = this.repository.load();
    if (data) this._tasks.set(data.tasks);
  });
```

`takeUntilDestroyed()` (with no argument) must be called in an injection context. A root service lives as long as the app, but the habit matters for components.

> Careful with option B from 8.1: when the other tab's data arrives, `_tasks.set(...)` triggers the save effect, which writes the same data back. It is harmless here (writing the same value fires no new event in this tab and does not loop), but it is a good example of why effects need thought.

### Common operators and when to use them

| Operator                  | Use it to...                                                    |
| ------------------------- | --------------------------------------------------------------- |
| `debounceTime`            | wait for the user to pause (search, autosave)                   |
| `distinctUntilChanged`    | skip repeated values                                            |
| `switchMap`               | cancel the old request when a new one starts (search over HTTP) |
| `concatMap`               | keep order: one after another (saving a queue)                  |
| `exhaustMap`              | ignore new events while one is running (double-clicked Save)    |
| `catchError`              | turn an error into a fallback value or a message                |
| `retry({ count, delay })` | try again on network errors                                     |
| `finalize`                | run cleanup on complete, error or unsubscribe                   |

---

## Pitfalls

- **Subscribing without unsubscribing** in components: memory leaks and updates to destroyed views. Prefer `toSignal`, resources, or `takeUntilDestroyed()`.
- **Nested `subscribe` calls**: use `switchMap` / `concatMap` instead.
- **Swallowing errors** in `catchError` and returning `EMPTY` everywhere: the UI never learns something failed.
- **Trusting `JSON.parse` output**: validate it.
- **Absolute URLs like `/seed.json`**: they ignore the base href and break on GitHub Pages.
- **Not handling `QuotaExceededError`**: `localStorage` is small (about 5 MB). Tell the user.

## Try it yourself

1. Write the repository with `load()` / `save()`, and test that invalid JSON returns `null`.
2. Make the store load from the repository and save after every change. Refresh the page: the tasks are still there.
3. Create `public/seed.json` and load it with `httpResource` only when nothing is saved. Clear storage in DevTools (Application → Local Storage) to see the first visit again.
4. Add the loading and error interceptors. Rename `seed.json` to break the request and watch the toast.
5. Build the debounced search. Add a `tap(console.log)` before and after `debounceTime` to see the difference.
6. Open the app in two tabs, change a task in one, and see the other update.
7. Fill storage on purpose (a loop writing big strings in the console) and check the "storage full" message.

## Further reading

- [HTTP client](https://angular.dev/guide/http)
- [`httpResource`](https://angular.dev/guide/http/http-resource) and [resources](https://angular.dev/guide/signals/resource)
- [Interceptors](https://angular.dev/guide/http/interceptors)
- [RxJS interop](https://angular.dev/ecosystem/rxjs-interop)
- [RxJS operators](https://rxjs.dev/guide/operators)
