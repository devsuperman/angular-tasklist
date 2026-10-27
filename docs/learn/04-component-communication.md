# Chapter 4 — Component communication

**Phase 2** · Concepts: `input()`, `input.required()`, `output()`, `model()`, content projection (`<ng-content>`), `viewChild()`, lifecycle hooks, `afterNextRender`, `DestroyRef`.

Chapter 2 split the UI into components. Now they need to talk: a parent gives data to a child, and a child tells the parent that something happened.

---

## 4.1 The rule: data down, events up

```
          TaskListComponent  (owns the tasks signal)
             │            ▲
   [task]="task"     (toggleDone)="toggle($event)"
   data goes down    events go up
             ▼            │
          TaskItemComponent  (shows one task, owns nothing)
```

### Why

Only **one** component (later, one store) owns a piece of state and is allowed to change it. Children receive data and **ask** for changes by emitting events. When something looks wrong, there is one place to look. `TaskItemComponent` stays reusable: it does not know where tasks live or how they are saved.

---

## 4.2 `input()`: data from parent to child

### What

`input()` declares a property the parent can bind with `[name]="..."`. It is a **signal**: read it with `task()`.

```ts
import { Component, computed, input } from '@angular/core';

export class TaskItemComponent {
  readonly task = input.required<Task>(); // the parent must pass it
  readonly compact = input(false); // optional, with a default
  readonly showProject = input(true, { transform: booleanAttribute }); // <app-task-item showProject>

  protected readonly isOverdue = computed(() => {
    const { done, dueDate } = this.task();
    return !done && !!dueDate && dueDate < new Date().toISOString().slice(0, 10);
  });
}
```

```html
<!-- parent -->
<app-task-item [task]="task" [compact]="true" />
```

- `input.required<Task>()`: if the parent forgets `[task]`, it is a **compile error**.
- Because inputs are signals, you can use them in `computed` (like `isOverdue`). There is no need for `ngOnChanges`.
- Inputs are **read-only** inside the child. You cannot `set` them. That enforces "data down".
- `transform` converts the bound value. `booleanAttribute` and `numberAttribute` are built in.

### How it is applied here

🟢 **Built (Phase 2)**: `TaskItemComponent` takes the task as `input.required()` ([TASKS.md](../TASKS.md)). Later, `ProjectBadgeComponent` could take `input.required<Project>()`.

---

## 4.3 `output()`: events from child to parent

### What

`output()` declares an event the parent can listen to with `(name)="..."`.

```ts
import { output } from '@angular/core';

export class TaskItemComponent {
  readonly task = input.required<Task>();
  readonly toggleDone = output<string>(); // emits the task id
  readonly remove = output<string>();
}
```

```html
<!-- task-item.html -->
<input type="checkbox" [checked]="task().done" (change)="toggleDone.emit(task().id)" />
<button type="button" (click)="remove.emit(task().id)" [attr.aria-label]="'Delete ' + task().title">
  🗑
</button>
```

```html
<!-- task-list.html (parent) -->
<app-task-item [task]="task" (toggleDone)="toggle($event)" (remove)="remove($event)" />
```

`$event` is whatever the child passed to `emit()`: here, the id.

### Why emit the id and not do the work?

The child does not know whether deleting needs a confirmation dialog (Phase 8), a save to storage (Phase 6), or nothing. It only reports intent. The parent (and later the store) decides what happens.

> **Naming.** Name outputs after what happened or what is asked (`toggleDone`, `remove`, `selected`), without an `on` prefix. Avoid names of native DOM events: `toggle`, `change`, `click` and `select` are real browser events, so `(toggle)` would also catch events bubbling from the DOM. The `@angular-eslint/no-output-native` rule (on in this project) reports them. That is why the outputs are `toggleDone` and `remove` and not the `toggle` / `delete` written in TASKS.md (`delete` is also a JavaScript keyword).

---

## 4.4 `model()`: two-way binding

### What

`model()` is an input the child is **also allowed to write**. Writing it notifies the parent. The parent uses the "banana in a box" syntax `[( )]`:

```ts
// filter-bar.ts
export class FilterBarComponent {
  readonly value = model<StatusFilter>('all');

  protected select(filter: StatusFilter) {
    this.value.set(filter); // updates the parent's signal too
  }
}
```

```html
<!-- filter-bar.html -->
<div role="group" aria-label="Filter tasks">
  @for (option of options; track option) {
    <button type="button" [attr.aria-pressed]="value() === option" (click)="select(option)">
      {{ option }}
    </button>
  }
</div>
```

```html
<!-- task-list.html -->
<app-filter-bar [(value)]="filter" />
```

Here `filter` is the parent's `signal<StatusFilter>('all')`. Pass the signal itself (no `()`), and Angular keeps both sides in sync.

### Why

A filter bar is a control: it shows a value **and** changes it. With `input` + `output` you would write `[value]="filter()" (valueChange)="filter.set($event)"`. `model()` is exactly that, shorter. Use it for components that act like form controls. For everything else, prefer one-way `input` + `output`: it is clearer who owns the state.

### How it is applied here

🟢 **Built (Phase 2)**: `FilterBarComponent` with `model()` for All / Pending / Done. The parent's `visibleTasks` computed (Chapter 3) reacts to it.

---

## 4.5 Content projection: `<ng-content>`

### What

**Content projection** lets the parent put its own markup **inside** a child component, like children of a `<div>`.

```ts
@Component({
  selector: 'app-card',
  template: `
    <section class="card">
      <header class="card-header"><ng-content select="[card-title]" /></header>
      <div class="card-body"><ng-content /></div>
      <footer class="card-footer"><ng-content select="[card-actions]" /></footer>
    </section>
  `,
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {}
```

```html
<app-card>
  <h2 card-title>Pending</h2>
  <p>{{ pendingCount() }} tasks left</p>
  <button card-actions type="button" (click)="filter.set('pending')">Show</button>
</app-card>
```

- `<ng-content />` without `select` gets everything that matched nothing else.
- `select` takes a CSS selector: an attribute (`[card-title]`), a tag, or a class.

### Why

`CardComponent` owns the **look** (border, padding, header, footer). The parent owns the **content**. One card component serves the counters, the statistics panel and the project list, without inputs for every possible piece of text.

### How it is applied here

🟢 **Built (Phase 2)**: a reusable `shared/components/card` with multi-slot `<ng-content>`.

---

## 4.6 `viewChild()`: reaching into your own template

### What

`viewChild()` gives the class a reference to an element or a child component **in its own template**. It is a signal.

```ts
export class AddTaskComponent {
  private readonly titleInput = viewChild.required<ElementRef<HTMLInputElement>>('titleInput');
  readonly add = output<string>();

  protected submit() {
    const input = this.titleInput().nativeElement;
    const title = input.value.trim();
    if (!title) return;
    this.add.emit(title);
    input.value = '';
    input.focus(); // ready for the next task
  }
}
```

```html
<form (submit)="$event.preventDefault(); submit()">
  <label for="new-task">New task</label>
  <input id="new-task" #titleInput />
  <button type="submit">Add</button>
</form>
```

- `'titleInput'` matches the template reference `#titleInput`.
- You can also query by component type: `viewChild(FilterBarComponent)`.
- `viewChildren()` returns all matches as a signal of an array.
- `contentChild()` / `contentChildren()` are the same idea for **projected** content (4.5).

### Why

Some things have no binding: focusing an input, measuring an element, calling a method on a child. Use `viewChild` for those. If a binding can do the job (`[value]`, `[class]`), prefer the binding.

### How it is applied here

🟢 **Built (Phase 2)**: the "add task" input uses `viewChild()` to focus the field after adding. In Phase 7 a reusable `appAutofocus` directive (Chapter 9) replaces part of this.

---

## 4.7 Lifecycle hooks, `afterNextRender` and `DestroyRef`

### What

A component is created, rendered, updated and destroyed. Angular lets you run code at those moments.

| Hook / API                                 | When                                             | Typical use in a signal-based app               |
| ------------------------------------------ | ------------------------------------------------ | ----------------------------------------------- |
| `constructor`                              | The class is created; inputs are **not** set yet | `inject()`, `effect()`, setup                   |
| `ngOnInit`                                 | After the first input values are set             | Rare now: `computed` reads inputs directly      |
| `ngOnChanges`                              | An input changed                                 | Rare now: use `computed` / `effect` on inputs   |
| `afterNextRender(fn)`                      | Once, after the next render to the DOM           | Measure or focus the DOM, start a 3rd-party lib |
| `afterEveryRender(fn)`                     | After every render                               | Rare; sync DOM with external code               |
| `ngOnDestroy` / `DestroyRef.onDestroy(fn)` | The component is removed                         | Clean up timers, listeners, subscriptions       |

### Why so few hooks?

Most lifecycle code in older Angular existed to **react to changes** (`ngOnChanges`) or to **start work when inputs arrive** (`ngOnInit`). With signal inputs, `computed` and `effect` do that automatically. What remains is DOM work (`afterNextRender`) and cleanup (`DestroyRef`).

### `DestroyRef`

```ts
export class ClockComponent {
  protected readonly now = signal(new Date());

  constructor() {
    const id = setInterval(() => this.now.set(new Date()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
```

`DestroyRef` can be injected anywhere (components, directives, services), so cleanup sits right next to the code that needs it. In Chapter 8, `takeUntilDestroyed()` uses it to end RxJS subscriptions.

### How it is applied here

🟢 **Built**: `DestroyRef` for the `storage` event listener (Phase 6) if it is not handled by `takeUntilDestroyed`; `afterNextRender` for focusing on first render in the `appAutofocus` directive (Phase 7).

---

## Pitfalls

- **Reading an input in the constructor.** It is not set yet; with `input.required` it throws. Read it in a `computed`, an `effect` or a template.
- **Mutating an input object in the child** (`this.task().done = true`). The parent's state changes behind its back, and `OnPush` parents will not notice. Emit an event instead.
- **Using `model()` for everything.** It blurs who owns state. Use it for form-like controls.
- **Reading a `viewChild` too early.** It is `undefined` until the view exists. Use `viewChild.required` and read it in event handlers or `afterNextRender`.

## Try it yourself

1. Give `TaskItemComponent` an `input.required<Task>()` and `toggleDone` / `remove` outputs. Wire them to the parent's signal.
2. Remove `[task]` from the parent template and read the compile error.
3. Build `FilterBarComponent` with `model()` and use `[(value)]="filter"`.
4. Build `CardComponent` with three slots and use it for the counters.
5. Build the "add task" input and focus it with `viewChild` after each add.
6. Add a `DestroyRef.onDestroy(() => console.log('bye'))` to `TaskItemComponent` and delete a task. Watch the log.

## In this repo

- `TaskItemComponent`: `task = input.required<Task>()`, `project = input<Project>()`, outputs `toggleDone` and `remove`. The names avoid native DOM event names (`toggle`), which `@angular-eslint/no-output-native` forbids.
- `FilterBarComponent`: `status = model<StatusFilter>('all')`, bound with `[(status)]`.
- `CardComponent` (`shared/components/card/card.ts`): `[card-title]`, default and `[card-actions]` slots.
- `AddTaskComponent`: `viewChild.required('titleInput')`.
- `DestroyRef`: `takeUntilDestroyed(inject(DestroyRef))` in `task-form-page.ts` and `persistence.service.ts`. `afterNextRender`: `shared/directives/autofocus.ts`.

## Further reading

- [Inputs](https://angular.dev/guide/components/inputs), [Outputs](https://angular.dev/guide/components/outputs)
- [Two-way binding with `model`](https://angular.dev/guide/templates/two-way-binding)
- [Content projection](https://angular.dev/guide/components/content-projection)
- [Queries (`viewChild`)](https://angular.dev/guide/components/queries)
- [Lifecycle](https://angular.dev/guide/components/lifecycle)
