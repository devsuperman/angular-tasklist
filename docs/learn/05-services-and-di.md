# Chapter 5 — Services and dependency injection

**Phase 3** · Concepts: services, `@Injectable`, `providedIn: 'root'`, `inject()`, injection context, provider scopes, `InjectionToken`, `useValue` / `useClass` / `useFactory` / `useExisting`, abstract classes as tokens.

---

## 5.1 The problem: components that know too much

At the end of Phase 2, `TaskListComponent` owns the tasks signal, the counters, the filter, and the add / toggle / remove logic. That works until:

- the **task form page** (Phase 4/5) needs to add and edit tasks: it cannot reach the list component's private signal;
- the **projects page** needs to know how many tasks each project has;
- you want to **save to `localStorage`** (Phase 6) without putting storage code in a component;
- you want to **test** the rules (what counts as overdue?) without rendering HTML.

The answer is to move state and logic into a **service**, and let Angular hand that service to anyone who asks. Handing it over is called **dependency injection (DI)**.

---

## 5.2 Services

### What

A service is a plain class with a focused job. It is marked with `@Injectable` so Angular can create it.

```ts
@Injectable({ providedIn: 'root' })
export class TaskStore { ... }
```

`providedIn: 'root'` means: "there is **one** instance for the whole app, created the first time somebody asks for it". It is also **tree-shakable**: if nobody injects it, it is not in the bundle.

### Why

[TECH_STACK.md](../TECH_STACK.md) defines the layers:

```
Component ──calls──▶ Store (signals) ──calls──▶ Repository ──▶ StorageService ──▶ localStorage
    ▲                     │
    └─── reads signals ───┘
```

- **Components** show data and send events. No business logic.
- **Stores** own state (in signals) and the rules.
- **Repositories** know how data is stored (Chapter 8).
- **`StorageService`** hides `localStorage` so tests can fake it.

Each layer only talks to the one below it, and each can be tested alone.

### How it is applied here

🟢 **Built (Phase 3)**: `core/services/task-store.ts`

```ts
import { Injectable, computed, signal } from '@angular/core';
import { Task } from '../models/task';

export type NewTask = Pick<Task, 'title' | 'priority' | 'projectId'> &
  Partial<Pick<Task, 'description' | 'dueDate' | 'tags'>>;

@Injectable({ providedIn: 'root' })
export class TaskStore {
  // Private and writable: only the store changes state
  private readonly _tasks = signal<Task[]>([]);

  // Public and read-only
  readonly tasks = this._tasks.asReadonly();
  readonly total = computed(() => this._tasks().length);
  readonly doneCount = computed(() => this._tasks().filter((t) => t.done).length);
  readonly pendingCount = computed(() => this.total() - this.doneCount());

  add(input: NewTask): Task {
    const task: Task = {
      id: crypto.randomUUID(),
      done: false,
      tags: [],
      order: this._tasks().length,
      createdAt: new Date().toISOString(),
      ...input,
    };
    this._tasks.update((tasks) => [...tasks, task]);
    return task;
  }

  toggle(id: string): void {
    this._tasks.update((tasks) => tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  update(id: string, changes: Partial<Omit<Task, 'id'>>): void {
    this._tasks.update((tasks) => tasks.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  }

  remove(id: string): void {
    this._tasks.update((tasks) => tasks.filter((t) => t.id !== id));
  }

  byId(id: string): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }
}
```

The component becomes thin:

```ts
export class TaskListComponent {
  private readonly store = inject(TaskStore);

  protected readonly tasks = this.store.tasks;
  protected readonly doneCount = this.store.doneCount;
  protected readonly filter = signal<StatusFilter>('all');   // UI state stays in the component
  protected readonly visibleTasks = computed(() => /* filter this.tasks() */);

  protected toggle(id: string) { this.store.toggle(id); }
  protected remove(id: string) { this.store.remove(id); }
}
```

**Which state goes where?** State shared by several pages, or that must be saved (tasks, projects), goes in a store. State that belongs to one screen and can be lost on navigation (the open filter, whether a menu is open) stays in the component. Later, the filter could move to the URL (Chapter 6).

---

## 5.3 `inject()` and the injection context

### What

`inject(Token)` asks Angular for an instance. It works in an **injection context**: field initializers, the constructor, provider factories, and functional guards, resolvers and interceptors.

```ts
export class TaskListComponent {
  private readonly store = inject(TaskStore); // ✅ field initializer
  private readonly router = inject(Router); // ✅

  protected open(id: string) {
    inject(Router); // ❌ throws: not an injection context
  }
}
```

The older style injects in the constructor: `constructor(private store: TaskStore) {}`. Both work. This project uses `inject()` ([TECH_STACK.md](../TECH_STACK.md), Conventions) because it also works in functions (guards, interceptors), keeps types simple, and does not depend on decorator metadata.

### Why DI at all? Why not `new TaskStore()`?

- **One shared instance.** Two components calling `new` would get two separate task lists.
- **Swappable implementations.** Tests can give `TaskStore` a fake storage; the store does not change.
- **The dependency tree is built for you.** `TaskStore` needs `TaskRepository`, which needs `StorageService`, which needs `APP_CONFIG`. Angular creates them in the right order.

---

## 5.4 Injectors and provider scopes

### What

An **injector** is a container that knows how to create things and keeps the instances. Injectors form a tree:

```
Environment injectors          Element injectors
─────────────────────          ─────────────────
platform                       App component
  └─ root (app.config +          └─ TaskListComponent   (providers: [...])
     providedIn: 'root')              └─ TaskItemComponent
       └─ lazy route injectors
          (route `providers`)
```

When a class calls `inject(X)`, Angular looks in the nearest injector, then its parent, and so on up to the root. The first match wins.

### Where you can provide something

| Where                                 | Scope                                             | Use in this project                                  |
| ------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `@Injectable({ providedIn: 'root' })` | One instance for the app                          | `TaskStore`, `ProjectStore`, repositories            |
| `appConfig.providers`                 | One instance for the app                          | `APP_CONFIG`, `StorageService` binding, router, http |
| A route's `providers`                 | One per lazy route (shared by its children)       | Possible: a service only the tasks feature uses      |
| A component's `providers`             | **One per component instance** (and its children) | A per-form state service (exercise below)            |

### Why component-level providers are interesting

```ts
@Component({
  selector: 'app-task-form',
  providers: [FormDraftService],   // each <app-task-form> gets its own
})
```

If two task forms were on screen, each would have its own `FormDraftService`. With `providedIn: 'root'`, they would share one and overwrite each other's draft. Phase 3 asks you to try this and see it.

---

## 5.5 `InjectionToken`: injecting things that are not classes

### What

DI needs a **token** to look things up. A class is its own token. A plain object, a string or a function has no class, so you create an `InjectionToken`:

```ts
// core/config/app-config.ts
import { InjectionToken } from '@angular/core';

export interface AppConfig {
  storageKey: string;
  seedUrl: string;
  features: { statistics: boolean; dragAndDrop: boolean };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
```

Provide it once:

```ts
// app.config.ts
{ provide: APP_CONFIG, useValue: { storageKey: 'angular-tasklist', seedUrl: 'seed.json', features: { statistics: true, dragAndDrop: false } } }
```

Use it anywhere:

```ts
private readonly config = inject(APP_CONFIG); // typed as AppConfig
```

A token can also carry a default, so it works without being provided:

```ts
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    storageKey: 'angular-tasklist',
    seedUrl: 'seed.json',
    features: { statistics: true, dragAndDrop: false },
  }),
});
```

### Why

The storage key and seed URL are **configuration**, not code. Putting them behind a token means a test can inject a different key (so tests do not touch real data), and the `*appFeatureFlag` directive in Chapter 9 can read `features` from the same place.

### How it is applied here

🟢 **Built (Phase 3)**: `APP_CONFIG` with the storage key and the seed data URL. 🟢 **Phase 7**: feature flags read from it.

---

## 5.6 Provider recipes

A provider is `{ provide: TOKEN, use...: ... }`.

| Recipe        | Meaning                                  | Example in this project                                      |
| ------------- | ---------------------------------------- | ------------------------------------------------------------ |
| `useClass`    | Create an instance of this class         | `{ provide: StorageService, useClass: LocalStorageService }` |
| `useValue`    | Use this exact value                     | `{ provide: APP_CONFIG, useValue: {...} }`                   |
| `useFactory`  | Call this function to create the value   | Choose an implementation at runtime (below)                  |
| `useExisting` | Alias: use the instance of another token | Rare; e.g. expose one service under two tokens               |

### Abstract class as a token: `StorageService`

🟢 **Built (Phase 3)**:

```ts
// core/services/storage.service.ts
export abstract class StorageService {
  abstract getItem(key: string): string | null;
  abstract setItem(key: string, value: string): void;
  abstract removeItem(key: string): void;
}

@Injectable()
export class LocalStorageService extends StorageService {
  getItem(key: string) {
    return localStorage.getItem(key);
  }
  setItem(key: string, value: string) {
    localStorage.setItem(key, value);
  }
  removeItem(key: string) {
    localStorage.removeItem(key);
  }
}

export class MemoryStorageService extends StorageService {
  private readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}
```

```ts
// app.config.ts
{ provide: StorageService, useClass: LocalStorageService }

// a test (Chapter 11)
TestBed.configureTestingModule({ providers: [{ provide: StorageService, useClass: MemoryStorageService }] });
```

Code that needs storage asks for the **abstraction**: `inject(StorageService)`. It never knows (or cares) which implementation it got.

**Why an abstract class and not an interface?** TypeScript interfaces do not exist at runtime, so DI cannot use them as tokens. An abstract class is both a type and a runtime value.

### `useFactory` example

```ts
{
  provide: StorageService,
  useFactory: () => {
    try {
      localStorage.setItem('__test', '1');
      localStorage.removeItem('__test');
      return new LocalStorageService();
    } catch {
      return new MemoryStorageService(); // private mode or storage disabled
    }
  },
}
```

Inside a factory you can call `inject()` to get other dependencies.

---

## Pitfalls

- **Providing a root service again in a component's `providers`.** You silently get a second instance, and two copies of the state.
- **Exposing writable signals from a store.** Then any component can `set` them, and the store's rules are bypassed. Expose `asReadonly()` and `computed`.
- **Calling `inject()` in a method or callback.** It throws (NG0203). Inject in a field and use the field.
- **Services that touch the DOM or `window` directly.** Wrap them (like `StorageService`) so tests and other environments can replace them.

## Try it yourself

1. Move the tasks signal and its methods from `TaskListComponent` into `TaskStore`. The component should have no `update` calls left.
2. Make `_tasks` private and expose `tasks` with `asReadonly()`. Try `store.tasks.set([])` in a component and read the compile error.
3. Create `APP_CONFIG` and inject it in the store. Log the key.
4. Create `StorageService`, `LocalStorageService` and `MemoryStorageService`. Bind one in `app.config.ts`, then switch to the other and see that nothing else changes.
5. Make a tiny `CounterService` with a signal. Provide it in `providedIn: 'root'`, and use it in two components: they share the value. Then put it in each component's `providers`: each gets its own. Write the difference in NOTES.md.

## In this repo

- `core/services/task-store.ts` and `project-store.ts`. Their state is a `linkedSignal` over `InitialData` (Chapter 8) rather than a plain `signal`, and saving moved out to `PersistenceService`.
- `core/config/app-config.ts`: `APP_CONFIG` with a default `factory` (`appConfigFactory`, which picks the seed file for the current language), also provided with `useFactory` in `app.config.ts`.
- `core/services/storage.service.ts`: `StorageService`, `LocalStorageService`, `MemoryStorageService` and `storageFactory` (the `useFactory` example from 5.6, used for real).
- The provider-scope exercise is a test: `core/services/di-scopes.spec.ts`.

## Further reading

- [Dependency injection overview](https://angular.dev/guide/di)
- [Creating injectable services](https://angular.dev/guide/di/creating-injectable-service)
- [Defining providers](https://angular.dev/guide/di/dependency-injection-providers)
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
