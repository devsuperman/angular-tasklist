# Chapter 10 — Deferred loading, CDK and accessibility

**Phase 8** (F8 · drag and drop, F9 · statistics, F10 · dark mode) · Concepts: `@defer` with triggers and `@placeholder` / `@loading` / `@error`, Angular CDK (drag and drop, overlay, a11y), Angular Material, animations, theming with CSS variables, accessibility.

---

## 10.1 `@defer`: lazy loading inside a template

### What

Chapter 6 lazy loaded whole **routes**. `@defer` lazy loads a **piece of a template**: the components, directives and pipes inside the block go into a separate chunk, downloaded only when a **trigger** fires.

```html
@defer (on viewport) {
  <app-statistics-panel [tasks]="tasks()" />
} @placeholder (minimum 300ms) {
  <div class="stats-skeleton" aria-hidden="true"></div>
} @loading (after 150ms; minimum 400ms) {
  <p>Loading statistics…</p>
} @error {
  <p role="alert">Could not load the statistics.</p>
}
```

| Block          | Shown when                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------- |
| `@placeholder` | Before the trigger fires (required for `on viewport`, which needs an element to watch)       |
| `@loading`     | While the chunk downloads. `after` avoids a flash on fast networks; `minimum` avoids flicker |
| `@error`       | If the download fails                                                                        |

### Triggers

| Trigger             | Loads when...                                           |
| ------------------- | ------------------------------------------------------- |
| `on idle` (default) | the browser is idle                                     |
| `on viewport`       | the placeholder scrolls into view                       |
| `on interaction`    | the user clicks or types in the placeholder             |
| `on hover`          | the pointer is over the placeholder                     |
| `on timer(2s)`      | after a delay                                           |
| `on immediate`      | right after the page renders                            |
| `when condition`    | a condition becomes true: `when showStats()`            |
| `prefetch on idle`  | download early, render later (combine with any trigger) |

### Why

The statistics panel (F9) is below the list, and it will use a chart, which is heavy. Most visits never scroll to it. With `@defer (on viewport)`, users who do not scroll never download it, and the first screen loads faster.

> The deferred components must be **standalone** and **not used anywhere else** without `@defer`, or they end up in the main bundle anyway. `ng build` shows deferred chunks as lazy.

### How it will be applied here

🔵 **Planned (Phase 8)**: the statistics panel inside `@defer (on viewport)` with `@placeholder` and `@loading`. Check it in the Network tab: the chunk loads when you scroll.

---

## 10.2 The Angular CDK

### What

The **Component Dev Kit** (`@angular/cdk`) is a set of **behavior** without styles: drag and drop, overlays, focus management, keyboard navigation, virtual scrolling, layout breakpoints. **Angular Material** (`@angular/material`) is a styled component library built on it.

```bash
ng add @angular/cdk          # behavior only
ng add @angular/material     # if you also want Material's components and theme
```

### Why

Drag and drop, dialogs and focus traps are hard to get right (touch support, keyboard users, screen readers, scrolling). The CDK is maintained by the Angular team and handles those cases. Using the CDK without Material lets you keep your own look.

### Drag and drop (F8)

🔵 **Planned (Phase 8)**:

```ts
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  imports: [CdkDropList, CdkDrag, TaskItemComponent],
  ...
})
export class TaskListPage {
  protected drop(event: CdkDragDrop<Task[]>) {
    const tasks = [...this.visibleTasks()];       // copy: never mutate signal values
    moveItemInArray(tasks, event.previousIndex, event.currentIndex);
    this.store.reorder(tasks.map((t) => t.id));    // the store sets `order` and saves
  }
}
```

```html
<ul cdkDropList (cdkDropListDropped)="drop($event)">
  @for (task of visibleTasks(); track task.id) {
    <li cdkDrag><app-task-item [task]="task" /></li>
  }
</ul>
```

- `moveItemInArray` **mutates** the array it gets, so pass a copy (Chapter 3).
- This is where `track task.id` really matters: with `$index`, the moved row would get the wrong state.
- Reordering a **filtered** list is tricky: what does "move to position 2" mean when some tasks are hidden? Deciding that is part of the exercise (one simple option: only allow drag and drop under the "All" filter).
- `order` is in the data model for this reason, and the store sorts by it.

### Confirmation dialog

Before deleting (a user story in [BUSINESS_PLAN.md](../BUSINESS_PLAN.md)):

```ts
// With @angular/cdk/dialog (unstyled) or MatDialog (Material)
private readonly dialog = inject(Dialog);

protected confirmDelete(task: Task) {
  const ref = this.dialog.open<boolean>(ConfirmDialogComponent, { data: { title: task.title } });
  ref.closed.subscribe((confirmed) => {
    if (confirmed) this.store.remove(task.id);
  });
}
```

The CDK dialog traps focus inside, closes on Escape, restores focus to the button that opened it, and sets the right ARIA roles. The native `<dialog>` element is a lighter alternative worth comparing.

---

## 10.3 Animations

Angular's old `@angular/animations` package is being replaced by plain CSS plus two template features:

```html
@if (showDetails()) {
  <section animate.enter="fade-in" animate.leave="fade-out">...</section>
}
```

```scss
.fade-in {
  animation: fade-in 150ms ease-out;
}
.fade-out {
  animation: fade-out 150ms ease-in;
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
}
@keyframes fade-out {
  to {
    opacity: 0;
  }
}
```

`animate.enter` adds the class when the element is inserted; `animate.leave` adds it and **waits for the animation to finish** before removing the element (CSS alone cannot animate removal). Check the current guide on angular.dev, since this area changed recently. Respect users who ask for less motion:

```scss
@media (prefers-reduced-motion: reduce) {
  .fade-in,
  .fade-out {
    animation: none;
  }
}
```

---

## 10.4 Theming: dark mode with a signal (F10)

🔵 **Planned (Phase 8)**:

```ts
// core/services/theme.service.ts
export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<Theme>(this.initialTheme());

  constructor() {
    effect(() => {
      const theme = this.theme();
      this.document.documentElement.dataset['theme'] = theme; // <html data-theme="dark">
      this.storage.setItem('angular-tasklist-theme', theme);
    });
  }

  toggle() {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private initialTheme(): Theme {
    const saved = this.storage.getItem('angular-tasklist-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}
```

```scss
// styles.scss
:root {
  --color-bg: #ffffff;
  --color-text: #1f2937;
  --color-danger: #b91c1c;
}
:root[data-theme='dark'] {
  --color-bg: #111827;
  --color-text: #f3f4f6;
  --color-danger: #f87171;
}
body {
  background: var(--color-bg);
  color: var(--color-text);
}
```

- The effect is a textbook use: it syncs a signal to **the DOM and storage**, both outside Angular (Chapter 3).
- `inject(DOCUMENT)` instead of the global `document`: easier to test.
- Components use CSS variables (`var(--color-text)`), so they never need to know the theme.

---

## 10.5 Accessibility (a11y)

### Why

The success criteria in [BUSINESS_PLAN.md](../BUSINESS_PLAN.md) include a Lighthouse accessibility score above 90. More importantly, the app should work for keyboard and screen reader users.

### What Angular gives you

- **The template a11y lint rules**, already on in `eslint.config.js` (`angular.configs.templateAccessibility`): they flag missing `alt` text, `click` handlers without keyboard handlers on non-buttons, form inputs without labels, and more. Run `npm run lint` often.
- **CDK a11y** (`@angular/cdk/a11y`): `cdkTrapFocus`, `FocusMonitor`, `LiveAnnouncer` (announce "Task deleted" to screen readers), `ListKeyManager` (arrow-key navigation in lists).
- **`routerLinkActive` + `ariaCurrentWhenActive`** (Chapter 6) and route `title`s.

### Checklist for this app

- Use real elements: `<button>` for actions, `<a routerLink>` for navigation, `<input type="checkbox">` for done. They come with keyboard support for free.
- Every input has a `<label for>`. Icon-only buttons have an `aria-label` (`'Delete ' + task.title`).
- Errors use `role="alert"` (as in Chapter 7) so they are announced.
- Visible focus: never `outline: none` without a replacement. Use `:focus-visible`.
- Color is never the only signal: overdue tasks get a border **and** a text or `title`; priority badges have text.
- Contrast is good in both themes.
- After deleting a task, move focus somewhere sensible and announce it with `LiveAnnouncer`.

---

## 10.6 Responsive layout

Use CSS first: flexbox / grid, `rem` units, and media or container queries. The CDK `BreakpointObserver` is there when **TypeScript** needs to know the screen size (for example, to open a full-screen dialog on phones), and with `toSignal` (Chapter 8) it becomes a signal:

```ts
protected readonly isHandset = toSignal(
  inject(BreakpointObserver).observe(Breakpoints.Handset).pipe(map((r) => r.matches)),
  { initialValue: false },
);
```

---

## Pitfalls

- **Using a deferred component outside `@defer`**: it is no longer deferred.
- **`@defer (on viewport)` without `@placeholder`**: there is nothing to observe; it is a compile error.
- **Mutating with `moveItemInArray`** on a signal's array: copy first.
- **Fixing a11y lint errors with `tabindex` and `(click)` on a `<div>`**: use a `<button>`.

## Try it yourself

1. Put a placeholder statistics panel inside `@defer (on viewport)`. Watch the chunk load in the Network tab as you scroll.
2. Try `on interaction` and `prefetch on idle` and note the difference.
3. Add CDK drag and drop and save the new order. Reload to check it persisted.
4. Add a confirmation dialog before delete. Test it with only the keyboard.
5. Build the theme toggle with a signal, CSS variables and an effect.
6. Run Lighthouse (DevTools → Lighthouse → Accessibility) and fix what it finds.

## Further reading

- [Deferrable views (`@defer`)](https://angular.dev/guide/templates/defer)
- [Angular CDK](https://material.angular.dev/cdk/categories) and [drag and drop](https://material.angular.dev/cdk/drag-drop/overview)
- [Animations](https://angular.dev/guide/animations)
- [Accessibility in Angular](https://angular.dev/best-practices/a11y)
