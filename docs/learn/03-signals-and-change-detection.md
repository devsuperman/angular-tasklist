# Chapter 3 — Signals and change detection

**Phase 2** (F3 · mark as done, F4 · filters, F7 · counters) · Concepts: `signal`, `computed`, `effect`, `linkedSignal`, `untracked`, change detection, zoneless, `OnPush`.

This is the most important chapter. Almost everything else in the project (stores, inputs, forms, HTTP resources) is built on signals.

---

## 3.1 The problem: keeping the screen in sync with the data

When a user ticks a checkbox, three things must change on screen: the row (crossed out), the "done" counter, and the "pending" counter. Somebody must know **what changed** and **what depends on it**.

**Change detection** is the process where Angular checks the data behind your templates and updates the DOM where it differs. The question is _when_ to run it and _which components_ to check.

- **Old way (zone.js):** patch every async browser API, run change detection after any event anywhere, and check every component. Simple, but wasteful and "magic".
- **This project (zoneless + signals):** values that the screen depends on are **signals**. When a signal changes, Angular knows exactly which templates read it, and updates only those.

That is why the project has no `zone.js` (Chapter 1) and why every component uses `ChangeDetectionStrategy.OnPush`.

---

## 3.2 `signal`: a value that notifies its readers

### What

A **signal** is a wrapper around a value that tells Angular when the value changes.

```ts
import { signal } from '@angular/core';

const count = signal(0); // WritableSignal<number>

count(); // read: 0
count.set(5); // replace the value
count.update((n) => n + 1); // compute the new value from the old one: 6
```

Reading a signal is a function call: `count()`. In a template, `{{ count() }}`. When the template runs, Angular records "this template read `count`". When `count` changes, that template is marked for update.

🟢 **In the code today**: `src/app/app.ts` has `protected readonly title = signal('Tasklist');` and `app.html` reads it with `{{ title() }}`.

### Immutability: always give a new value

Signals compare the old and new value with `Object.is` by default. If you change an array or object **in place**, the reference does not change, and nobody is notified.

```ts
// ❌ Wrong: mutates the same array; the screen does not update
this.tasks().push(newTask);

// ✅ Right: a new array
this.tasks.update((tasks) => [...tasks, newTask]);

// ✅ Toggle one task: a new array with one new object
this.tasks.update((tasks) => tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

// ✅ Remove
this.tasks.update((tasks) => tasks.filter((t) => t.id !== id));
```

These three patterns (spread to add, `map` to change, `filter` to remove) are the whole `TaskStore` in Chapter 5.

### How it is applied here

🟢 **Built (Phase 2)**: `TaskListComponent` keeps the tasks in a signal and changes them on events:

```ts
export class TaskListComponent {
  protected readonly tasks = signal<Task[]>(INITIAL_TASKS);

  protected toggle(id: string) {
    this.tasks.update((tasks) => tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  protected remove(id: string) {
    this.tasks.update((tasks) => tasks.filter((t) => t.id !== id));
  }
}
```

In Phase 3 this state moves into a service (Chapter 5), but the signal code stays the same.

---

## 3.3 `computed`: derived values

### What

A **computed signal** is a read-only signal whose value is calculated from other signals.

```ts
const total = computed(() => this.tasks().length);
```

- It is **lazy**: it runs only when somebody reads it.
- It is **cached** (memoized): reading it twice without changes does not recalculate.
- Its dependencies are tracked **automatically**: whatever signals it reads while running become its dependencies. No dependency lists to maintain.

### Why

The counters (F7) and the filtered list (F4) are not new state. They are **derived** from the tasks. If you stored them in their own signals, you would have to remember to update them every time the tasks change, and one day you would forget. With `computed`, they cannot be out of sync.

> Rule: if a value can be calculated from other state, make it a `computed`, not a `signal`.

### How it is applied here

🟢 **Built (Phase 2)**: counters and filtering.

```ts
export type StatusFilter = 'all' | 'pending' | 'done';

export class TaskListComponent {
  protected readonly tasks = signal<Task[]>(INITIAL_TASKS);
  protected readonly filter = signal<StatusFilter>('all');

  // F7 — counters
  protected readonly total = computed(() => this.tasks().length);
  protected readonly doneCount = computed(() => this.tasks().filter((t) => t.done).length);
  protected readonly pendingCount = computed(() => this.total() - this.doneCount());
  protected readonly overdueCount = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.tasks().filter((t) => !t.done && t.dueDate && t.dueDate < today).length;
  });

  // F4 — filter
  protected readonly visibleTasks = computed(() => {
    const filter = this.filter();
    const tasks = this.tasks();
    if (filter === 'all') return tasks;
    return tasks.filter((t) => (filter === 'done' ? t.done : !t.done));
  });
}
```

```html
<p>{{ doneCount() }} / {{ total() }} done · {{ overdueCount() }} overdue</p>

@for (task of visibleTasks(); track task.id) {
  <app-task-item [task]="task" (toggleDone)="toggle($event)" (remove)="remove($event)" />
}
```

Notice the chain: `pendingCount` depends on `total` and `doneCount`, which depend on `tasks`. Toggle a task and the whole chain updates by itself.

> `overdueCount` reads "today" once per calculation, and "today" is not a signal. If the app stays open past midnight the value is stale until the tasks change. That is fine for this app; if it were not, you would put "today" in a signal and update it with a timer.

---

## 3.4 `effect`: side effects, used sparingly

### What

An **effect** is a function that runs when the signals it reads change. Unlike `computed`, it returns nothing; it _does_ something.

```ts
constructor() {
  effect(() => {
    console.log('Tasks changed:', this.tasks().length);
  });
}
```

Effects must be created in an **injection context** (a constructor or a field initializer) and are destroyed with the component automatically.

### Why (and why not)

Effects are for syncing signals with **the world outside Angular's reactivity**: `localStorage`, a log, a chart library, `document.title`. They are **not** for keeping signals in sync with each other: that is what `computed` is for.

```ts
// ❌ Wrong: copying signal to signal with an effect
effect(() => this.doneCount.set(this.tasks().filter((t) => t.done).length));

// ✅ Right
doneCount = computed(() => this.tasks().filter((t) => t.done).length);
```

The wrong version runs later than the right one (effects are scheduled), creates moments where the two values disagree, and hides the relationship.

### How it is applied here

- 🟢 **Phase 2**: TASKS.md asks you to log state changes with an effect, then **remove it**. The goal is to feel how effects work and learn when not to use them.
- 🟢 **Phase 6**: a real use. The store saves to storage whenever the tasks change:

  ```ts
  effect(() => this.repository.saveAll(this.tasks()));
  ```

  (Whether to save in an effect or explicitly inside each method is a design choice. Chapter 8 discusses both.)

- 🟢 **Phase 8**: the theme toggle writes a class on `<html>` and saves the choice, both side effects outside Angular.

### `untracked`

Sometimes an effect needs to read a signal **without** depending on it:

```ts
effect(() => {
  const tasks = this.tasks(); // tracked: the effect reruns when tasks change
  const key = untracked(() => this.storageKey()); // not tracked
  localStorage.setItem(key, JSON.stringify(tasks));
});
```

---

## 3.5 `linkedSignal`: writable state that resets from a source

### What

A **linked signal** is a writable signal whose value is **recomputed when a source changes**, but which you can also `set` by hand in between.

```ts
const selectedId = linkedSignal(() => this.visibleTasks()[0]?.id);
selectedId.set('42'); // the user picks another one
// When visibleTasks changes, selectedId goes back to the first visible task
```

### Why

`computed` is read-only. `signal` does not react to anything. Some state is in between: "the user's choice, which should reset when the context changes". Without `linkedSignal`, you would write an effect that calls `set`, which is the anti-pattern above.

### How it is applied here

🟢 **Built (Phases 5 and 6)**: the app uses `linkedSignal` in the stores (state that starts from the saved data or the seed, Chapter 8) and in the project form (fields that start from the project being renamed, Chapter 7). Other possible uses:

- The **selected project** on the task form: defaults to the project of the current filter, but the user can change it; it resets when the filter changes.
- A **"selected task"** in the list that falls back to the first visible task when the filter hides it.

With the long form you can keep the previous choice when it is still valid:

```ts
protected readonly selectedId = linkedSignal<Task[], string | undefined>({
  source: this.visibleTasks,
  computation: (tasks, previous) =>
    tasks.some((t) => t.id === previous?.value) ? previous?.value : tasks[0]?.id,
});
```

---

## 3.6 `OnPush` and when a component is checked

### What

With `ChangeDetectionStrategy.OnPush`, Angular checks a component only when:

1. a **signal** read by its template changes,
2. one of its **inputs** gets a new value (a new reference),
3. an **event** bound in its template (or a child's) fires, or
4. something calls `ChangeDetectorRef.markForCheck()` (rare with signals).

### Why

In a zoneless app this is how things work anyway, and `OnPush` makes it explicit and consistent. It also enforces the immutability habit from 3.2: if you mutate an object passed as an input, the child is not checked. That is a feature: it makes data flow predictable.

### How it is applied here

🟢 The root `App` already uses `OnPush`. [TECH_STACK.md](../TECH_STACK.md) makes it a convention for every component.

---

## 3.7 Read-only signals

A component or service often wants to let others **read** a signal but not **write** it.

```ts
private readonly _tasks = signal<Task[]>([]);
readonly tasks = this._tasks.asReadonly(); // Signal<Task[]>, no set/update
```

This is the core pattern of the stores in Chapter 5: the writable signal is private, the public API is read-only signals plus methods (`add`, `toggle`, `remove`).

---

## 3.8 Signals vs RxJS (preview)

Both are reactive, but they model different things:

| Signals                                    | RxJS Observables                                     |
| ------------------------------------------ | ---------------------------------------------------- |
| A **value** that changes over time         | A **stream** of events over time                     |
| Always has a current value                 | May have no value yet; may complete or error         |
| Synchronous, glitch-free                   | Can be async, with timing operators (`debounceTime`) |
| Best for state and what the template shows | Best for events: typing, HTTP, `storage` events      |

The project uses signals for state and RxJS where time matters (search with debounce, cross-tab sync), and connects them with `toSignal` / `toObservable` (Chapter 8).

---

## Pitfalls

- **Mutating instead of replacing.** `push`, `splice`, or `task.done = true` on a signal's value: no update.
- **Writing signals inside `computed`.** A computed must be pure; Angular throws an error if you try.
- **Using `effect` to derive state.** Use `computed` or `linkedSignal`.
- **Reading a signal outside a reactive context and expecting it to update.** `const n = this.count();` in a constructor is a snapshot.
- **Forgetting `()`.** `@if (isOverdue)` is always true (a function is truthy); write `@if (isOverdue())`. The compiler warns about some of these.

## Try it yourself

1. Put the task array in a `signal` and implement `toggle` and `remove` with `update`.
2. Try `this.tasks().push(...)` on purpose. See that the screen does not change. Fix it.
3. Add `total`, `doneCount`, `pendingCount` and `overdueCount` as `computed`. Add a `console.log` inside one and see when it runs (and when it does not).
4. Add the status filter and `visibleTasks`.
5. Add an `effect` that logs the tasks. Then remove it, and write in NOTES.md when an effect is the right tool.
6. Make a `linkedSignal` for a selected task that resets when the filter changes.

## In this repo

- `computed`: the counters in `core/services/task-store.ts`, `visibleTasks` in `task-list.ts`, the statistics rows.
- `effect`: saving in `core/services/persistence.service.ts`, the theme in `theme.service.ts`, filling the task form in `task-form-page.ts` (with `untracked`), and `FeatureFlagDirective`. The Phase 2 logging effect was added and then removed, as planned.
- `linkedSignal`: the stores' state (`TaskStore`, `ProjectStore`) and the project form fields.
- `resource`: `httpResource` in `core/services/initial-data.ts`.

## Further reading

- [Signals overview](https://angular.dev/guide/signals)
- [`linkedSignal`](https://angular.dev/guide/signals/linked-signal)
- [Effects](https://angular.dev/guide/signals/effect)
- [Zoneless](https://angular.dev/guide/zoneless)
