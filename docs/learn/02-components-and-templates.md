# Chapter 2 — Components and templates

**Phase 1** (F1 · task list) · Concepts: standalone components, interpolation, property and event binding, class and style bindings, built-in control flow (`@if`, `@for`, `@switch`, `@let`), component styles.

---

## 2.1 What a component is

### What

A **component** is a piece of UI with three parts:

| Part     | File             | Job                                        |
| -------- | ---------------- | ------------------------------------------ |
| Class    | `task-item.ts`   | Data and behavior (TypeScript)             |
| Template | `task-item.html` | What it looks like (HTML + Angular syntax) |
| Styles   | `task-item.scss` | How it looks, scoped to this component     |

An Angular app is a **tree of components**. `App` is the root (Chapter 1); pages and small pieces (a task row, a badge, a button) are components inside it.

### Why

Splitting the UI into components gives you small pieces you can understand, test and reuse on their own. In this project, the same `TaskItemComponent` will render each row of the list, and `CardComponent` will wrap different content on different pages.

### How it will be applied here

🔵 **Planned (Phase 1)**: the tasks feature will have these components:

```
features/tasks/
  task-list/      TaskListComponent     the page: list + counters + filter bar
  task-item/      TaskItemComponent     one row: checkbox, title, priority badge, due date
```

---

## 2.2 The model comes first

Before writing components, define the shape of the data. The data model is in [TECH_STACK.md](../TECH_STACK.md).

🔵 **Planned (Phase 1)**: `core/models/task.ts`

```ts
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  priority: Priority;
  dueDate?: string; // ISO date, for example '2026-11-03'
  tags: string[];
  projectId: string;
  order: number;
  createdAt: string;
}
```

**Why an `interface` and not a class?** The data comes from JSON (`localStorage`, `seed.json`). JSON gives you plain objects, not class instances, so an interface describes it honestly. **Why a union type for `Priority`?** The compiler (and the template type checker) will reject `priority: 'urgent'`, and `@switch` on a priority can cover every case.

---

## 2.3 Anatomy of a standalone component

🔵 **Planned (Phase 1)**: `features/tasks/task-list/task-list.ts`

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Task } from '../../../core/models/task';
import { TaskItemComponent } from '../task-item/task-item';

@Component({
  selector: 'app-task-list',
  imports: [TaskItemComponent],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  protected readonly tasks = signal<Task[]>([
    {
      id: '1',
      title: 'Read the signals guide',
      done: false,
      priority: 'high',
      tags: [],
      projectId: 'study',
      order: 0,
      createdAt: '2026-10-01',
    },
    {
      id: '2',
      title: 'Buy coffee',
      done: true,
      priority: 'low',
      tags: [],
      projectId: 'home',
      order: 1,
      createdAt: '2026-10-02',
    },
  ]);
}
```

| Metadata                   | Meaning                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `selector`                 | The HTML tag to use the component: `<app-task-list />`                                                                                   |
| `imports`                  | Every component, directive and pipe the **template** uses. This is what "standalone" means: the component declares its own dependencies. |
| `templateUrl` / `template` | An external HTML file, or an inline string for very small components                                                                     |
| `styleUrl` / `styles`      | Styles that apply only to this component                                                                                                 |
| `changeDetection`          | `OnPush` in this project, always (Chapter 3)                                                                                             |

> Built-in control flow (`@if`, `@for`...) needs no import. Other components, directives (`RouterLink`, `NgClass`) and pipes (`DatePipe`) do.

---

## 2.4 Template syntax: bindings

A template is HTML plus a few kinds of **bindings** that connect it to the class.

| Syntax                    | Direction            | Example                                                |
| ------------------------- | -------------------- | ------------------------------------------------------ |
| `{{ expression }}`        | class → text         | `<span>{{ task().title }}</span>`                      |
| `[property]="expression"` | class → DOM          | `<input type="checkbox" [checked]="task().done" />`    |
| `(event)="statement"`     | DOM → class          | `<button (click)="remove()">Delete</button>`           |
| `[attr.name]`             | class → attribute    | `<li [attr.aria-label]="task().title">`                |
| `[class.name]`            | class → CSS class    | `<li [class.done]="task().done">`                      |
| `[style.prop]`            | class → inline style | `<span [style.background]="project().color">`          |
| `#ref`                    | template reference   | `<input #title /> <button (click)="add(title.value)">` |

**Interpolation vs property binding.** `{{ }}` always produces text. `[checked]="task().done"` passes the real `boolean`. Use property binding for anything that is not text.

**Property vs attribute.** `[value]` sets the DOM _property_; `[attr.aria-label]` sets the HTML _attribute_. ARIA attributes and `colspan` have no matching property, so they need `attr.`.

**`$event`.** In an event binding, `$event` is the DOM event: `(input)="search($event)"`. For a component's `output()` (Chapter 4), `$event` is the emitted value.

🔵 **Planned (Phase 1)**: `task-item.html`

```html
<li class="task" [class.done]="task().done" [class.overdue]="isOverdue()">
  <input
    type="checkbox"
    [id]="'task-' + task().id"
    [checked]="task().done"
    (change)="toggleDone.emit(task().id)"
  />
  <label [for]="'task-' + task().id">{{ task().title }}</label>
  <span class="badge" [class]="'badge-' + task().priority">{{ task().priority }}</span>
</li>
```

(`task()`, `isOverdue()` and `toggleDone` come from Chapters 3 and 4.)

**Keep templates simple.** Template expressions should be cheap reads, not logic. Something like `tasks().filter(t => !t.done).length` belongs in a `computed` in the class (Chapter 3), where it is cached, named and testable.

---

## 2.5 Built-in control flow

### What

Blocks that start with `@` decide what is rendered: `@if`, `@for`, `@switch`, `@let`, and `@defer` (Chapter 10). They replaced the older `*ngIf`, `*ngFor` and `[ngSwitch]` directives. This project uses only the new syntax ([TECH_STACK.md](../TECH_STACK.md), Conventions).

### Why

They are part of the template language, so they need no imports, they are type checked (inside `@if (task(); as t)`, `t` is not `undefined`), they are faster, and they read like normal code.

### `@if` / `@else if` / `@else`

```html
@if (tasks().length === 0) {
  <p class="empty">No tasks yet. Add your first one above.</p>
} @else if (visibleTasks().length === 0) {
  <p class="empty">No tasks match this filter.</p>
} @else {
  <ul>...</ul>
}
```

Use `as` to give a name to the result of an expression:

```html
@if (selectedProject(); as project) {
  <h2 [style.color]="project.color">{{ project.name }}</h2>
}
```

### `@for` with `track` and `@empty`

```html
<ul class="task-list">
  @for (task of tasks(); track task.id; let i = $index, last = $last) {
    <app-task-item [task]="task" />
  } @empty {
    <li class="empty">Nothing to do 🎉</li>
  }
</ul>
```

- **`track` is required.** It tells Angular how to recognize the same item between renders. With `track task.id`, toggling one task updates one row instead of rebuilding the whole list, and it keeps focus and checkbox state in place. Track by a unique, stable id. Use `$index` only for static lists that never reorder; with drag and drop (Chapter 10) it would be wrong.
- **`@empty`** renders when the list is empty: the empty state for F1.
- Context variables: `$index`, `$first`, `$last`, `$even`, `$odd`, `$count`.

### `@switch`

The priority badge is a good fit, because `Priority` has exactly three values:

```html
@switch (task().priority) {
  @case ('high') { <span class="badge badge-high">High</span> }
  @case ('medium') { <span class="badge badge-medium">Medium</span> }
  @case ('low') { <span class="badge badge-low">Low</span> }
}
```

Compare it with `[class]="'badge-' + task().priority"` from 2.4. Both are valid. `@switch` lets each case render **different markup**; a class binding is shorter when only the style changes. Phase 1 asks you to try both.

### `@let`

`@let` declares a read-only local variable inside a template:

```html
@let overdue = overdueCount();
@if (overdue > 0) {
  <p class="warning">{{ overdue }} {{ overdue === 1 ? 'task is' : 'tasks are' }} overdue</p>
}
```

Use it to avoid repeating a long expression. If the value needs logic, a `computed` in the class is still the better home.

---

## 2.6 Component styles

### What

Styles in `styleUrl` apply **only** to that component's template. Angular rewrites the selectors behind the scenes (it adds attributes like `_ngcontent-abc`) so `.badge` in `task-item.scss` cannot leak into another component. This is called **view encapsulation** (the default mode is `Emulated`).

### Why

You can use short, simple class names (`.title`, `.badge`) in every component without naming collisions. That matters as the app grows.

### How it is applied here

- 🟢 `src/styles.scss` holds **global** styles: the `body` font and margin. Later it will hold CSS variables for the theme (Chapter 10).
- 🟢 `src/app/app.scss` styles only the root component's header and `<main>`.
- 🔵 Each new component gets its own `.scss` file (the CLI is configured for SCSS in `angular.json`).

Two selectors help when you need to reach outside the box:

```scss
:host {
  // the component's own element, <app-task-item>
  display: block;
}

:host(.compact) .title {
  // when the host has the class "compact"
  font-size: 0.875rem;
}
```

Custom elements like `<app-task-item>` are `display: inline` by default, which often surprises people. Set `:host { display: block; }` when the component is a block.

> `angular.json` sets a budget of 4 kB (warning) / 8 kB (error) per component stylesheet. If you hit it, the component is probably doing too much.

---

## Pitfalls

- **Forgetting to add a component to `imports`.** The build fails with "'app-task-item' is not a known element". Add the class to the parent's `imports`.
- **Calling methods in templates that do heavy work.** They run on every check. Use `computed` (Chapter 3).
- **`track $index` on a list that changes order.** Rows get the wrong state. Track by `id`.
- **Forgetting the `()` on signals.** `{{ title }}` prints the function; `{{ title() }}` prints the value.

## Try it yourself

1. Create `core/models/task.ts` and `core/models/project.ts` from TECH_STACK.md.
2. Generate `TaskListComponent` and render a hard-coded array of 5 tasks with `@for`. Show it from the root component (temporarily put `<app-task-list />` in `app.html`, until routing exists in Chapter 6).
3. Add the `@empty` block, then set the array to `[]` to see it.
4. Make done tasks look crossed out with `[class.done]`.
5. Style the priority badge twice, once with `@switch` and once with a class binding. Keep the one you prefer and write why in NOTES.md.
6. Use `@let` to show "3 of 5 done" without repeating expressions.

## Further reading

- [Components](https://angular.dev/guide/components)
- [Template syntax](https://angular.dev/guide/templates)
- [Control flow](https://angular.dev/guide/templates/control-flow)
- [Styling components](https://angular.dev/guide/components/styling)
