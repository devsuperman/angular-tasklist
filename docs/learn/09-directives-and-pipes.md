# Chapter 9 — Directives and pipes

**Phase 7** · Concepts: attribute directives, `host` bindings and listeners, directive inputs, structural directives (`TemplateRef`, `ViewContainerRef`), `hostDirectives`, pure pipes, built-in pipes (`date`, `titlecase`, `async`...).

Components are one kind of **directive**: a directive with a template. This chapter covers the other two kinds, plus pipes. They are the small reusable tools that live in `shared/`.

---

## 9.1 Directives: behavior without a template

### What

A **directive** adds behavior to an element that already exists. It has a `selector` (usually an attribute) but no template.

| Kind                 | Changes...                                 | Example here                          |
| -------------------- | ------------------------------------------ | ------------------------------------- |
| Component            | Renders its own template                   | `TaskItemComponent`                   |
| Attribute directive  | The look or behavior of its host element   | `appHighlightOverdue`, `appAutofocus` |
| Structural directive | Whether / how often a template is rendered | `*appFeatureFlag`                     |

### Why

Some behavior is needed on **many different elements**, and none of them should own it. "Highlight if overdue" applies to a task row, a calendar cell or a badge. "Focus on load" applies to the first field of every form. Writing it once as a directive keeps components small.

---

## 9.2 Attribute directive: `appHighlightOverdue`

🟢 **Built (Phase 7)**: `shared/directives/highlight-overdue.ts`

```ts
import { Directive, computed, input } from '@angular/core';

@Directive({
  selector: '[appHighlightOverdue]',
  host: {
    '[class.overdue]': 'isOverdue()',
    '[attr.title]': 'isOverdue() ? "Overdue" : null',
  },
})
export class HighlightOverdueDirective {
  readonly dueDate = input<string | undefined>(undefined, { alias: 'appHighlightOverdue' });
  readonly done = input(false);

  protected readonly isOverdue = computed(() => {
    const due = this.dueDate();
    return !this.done() && !!due && due < new Date().toISOString().slice(0, 10);
  });
}
```

```html
<li [appHighlightOverdue]="task().dueDate" [done]="task().done">...</li>
```

```scss
// styles.scss (global, since the class lands on other components' elements)
.overdue {
  border-left: 4px solid var(--color-danger);
}
```

What to notice:

- **`selector: '[appHighlightOverdue]'`**: the brackets mean "an attribute". ESLint in this project requires the `app` prefix and camelCase (Chapter 1).
- **`host`** binds properties, attributes, classes and events on the element the directive sits on. It is the directive's version of a template.
- **`alias`** lets the main input have the same name as the selector, so `[appHighlightOverdue]="..."` passes the date directly.
- Inputs are signals, so `computed` works just as in components.

> The `host` object in the decorator is the recommended way. You may see `@HostBinding` and `@HostListener` decorators in older code; they do the same thing.

### Listening to host events

```ts
host: {
  '(mouseenter)': 'hovering.set(true)',
  '(mouseleave)': 'hovering.set(false)',
  '(keydown.escape)': 'close()',
}
```

---

## 9.3 Attribute directive with DOM access: `appAutofocus`

🟢 **Built (Phase 7)**: `shared/directives/autofocus.ts`

```ts
import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

@Directive({ selector: '[appAutofocus]' })
export class AutofocusDirective {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => element.focus());
  }
}
```

```html
<input id="title" formControlName="title" appAutofocus />
```

- **`ElementRef`** gives the host DOM element. Inject it like any service.
- **`afterNextRender`** (Chapter 4) waits until the element is really in the DOM before focusing.
- Why not the HTML `autofocus` attribute? It only works on the first page load, not when Angular renders a form after navigation.

It replaces the `viewChild` focus code from Chapter 4 for the "focus on first render" case.

---

## 9.4 Structural directive: `*appFeatureFlag`

### What

A **structural directive** decides whether a piece of template is rendered, and how many times. The `*` is sugar:

```html
<section *appFeatureFlag="'statistics'">...</section>
```

is short for:

```html
<ng-template [appFeatureFlag]="'statistics'">
  <section>...</section>
</ng-template>
```

An `<ng-template>` is not rendered by itself. The directive receives it as a `TemplateRef` and creates a view from it with `ViewContainerRef` when it wants.

### How it is applied here

🟢 **Built (Phase 7)**: show content only when a flag in `APP_CONFIG` (Chapter 5) is on.

```ts
// shared/directives/feature-flag.ts
import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../../core/config/app-config';

@Directive({ selector: '[appFeatureFlag]' })
export class FeatureFlagDirective {
  private readonly template = inject(TemplateRef);
  private readonly container = inject(ViewContainerRef);
  private readonly features = inject(APP_CONFIG).features;

  readonly appFeatureFlag = input.required<keyof AppConfig['features']>();

  constructor() {
    effect(() => {
      this.container.clear();
      if (this.features[this.appFeatureFlag()]) {
        this.container.createEmbeddedView(this.template);
      }
    });
  }
}
```

```html
<app-statistics-panel *appFeatureFlag="'statistics'" />
```

Here `effect` is the right tool: creating and destroying views is a side effect on the DOM, driven by a signal input.

### Why write one when `@if` exists?

In real apps you would often just write `@if (features.statistics)`. Writing a structural directive teaches you how `@if`, `@for` and `*ngIf` work inside: templates are values that can be rendered zero, one or many times. That knowledge is needed for advanced components (tables, virtual lists, overlays).

---

## 9.5 `hostDirectives`: composing behavior

A component or directive can **include** other directives on its host element:

```ts
@Component({
  selector: 'app-task-item',
  hostDirectives: [
    { directive: HighlightOverdueDirective, inputs: ['appHighlightOverdue: dueDate', 'done'] },
  ],
  ...
})
export class TaskItemComponent {}
```

Now every `<app-task-item [dueDate]="..." [done]="...">` gets the overdue behavior without the user adding the attribute. It is composition instead of inheritance: small directives combined into bigger components. Inputs and outputs must be listed explicitly to be exposed.

---

## 9.6 Pipes

### What

A **pipe** transforms a value **for display** in a template: `{{ value | pipeName: arg }}`.

```html
{{ task.dueDate | date: 'mediumDate' }}     → Nov 3, 2026
{{ task.priority | titlecase }}             → High
{{ ratio | percent: '1.0-0' }}              → 42%
```

### Why

Formatting is not business logic, and it is needed in many templates. A pipe is a reusable, testable function. **Pure** pipes (the default) are also fast: Angular reruns them only when the input value changes (by reference), not on every check.

### Built-in pipes used in this project

| Pipe                | Use here                                                               |
| ------------------- | ---------------------------------------------------------------------- |
| `date`              | Due dates and created dates                                            |
| `titlecase`         | Priority and project names                                             |
| `async`             | Rarely: subscribe to an Observable in the template (prefer `toSignal`) |
| `json`              | Debugging: `<pre>{{ form.value \| json }}</pre>`                       |
| `percent`, `number` | The statistics panel (Phase 8)                                         |

Built-in pipes must be imported like anything else: `imports: [DatePipe, TitleCasePipe]`.

### Custom pipe: `relativeDate`

🟢 **Built (Phase 7)**: `shared/pipes/relative-date.pipe.ts`

```ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'relativeDate' })
export class RelativeDatePipe implements PipeTransform {
  private readonly format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  transform(
    isoDate: string | undefined,
    today: string = new Date().toISOString().slice(0, 10),
  ): string {
    if (!isoDate) return '';
    const days = Math.round((Date.parse(isoDate) - Date.parse(today)) / 86_400_000);
    return this.format.format(days, 'day'); // "tomorrow", "in 2 days", "yesterday", "3 days ago"
  }
}
```

```html
<span>{{ task().dueDate | relativeDate }}</span>
```

Notes:

- `Intl.RelativeTimeFormat` does the language work; with i18n (Chapter 12) you would pass the app's locale (`inject(LOCALE_ID)`).
- The optional `today` argument makes the pipe **easy to test**: no need to fake the clock.
- It is **pure**, so if the app stays open overnight, "tomorrow" will not become "today" until the task changes. A trade-off worth knowing; `pure: false` would fix it at the cost of running on every check.

### Custom pipe: `priorityLabel`

```ts
@Pipe({ name: 'priorityLabel' })
export class PriorityLabelPipe implements PipeTransform {
  private readonly labels: Record<Priority, string> = {
    low: '🟢 Low',
    medium: '🟡 Medium',
    high: '🔴 High',
  };
  transform(priority: Priority): string {
    return this.labels[priority];
  }
}
```

`Record<Priority, string>` makes the compiler check that every priority has a label.

### Pipe vs `computed` vs method

- Formatting **one value**, used in **many templates** → pipe.
- A value derived from **state**, used in one component → `computed`.
- Avoid calling methods in templates for formatting: they run on every check, while pure pipes are cached.

---

## Pitfalls

- **Missing `imports`**: a directive or pipe that is not in the component's `imports` does nothing (an unknown attribute is silently ignored) or fails to compile (a pipe).
- **Wrong selector brackets**: `selector: 'appAutofocus'` (no brackets) matches an **element** named `appAutofocus`, not an attribute.
- **Direct DOM manipulation where a binding works**: use `host` bindings before reaching for `ElementRef`.
- **Impure pipes** for heavy work: they run on every change detection.
- **Two structural directives on one element**: not allowed. Wrap one in `<ng-container>`.

## Try it yourself

1. Write `appHighlightOverdue` and use it on the task row and in one more place.
2. Write `appAutofocus` and use it on the first field of both forms.
3. Add `features` to `APP_CONFIG` and write `*appFeatureFlag`. Toggle the flag and watch the section appear and disappear.
4. Use `hostDirectives` to add the overdue highlight to `TaskItemComponent` itself.
5. Write `relativeDate` and `priorityLabel`, with unit tests that pass a fixed `today`.
6. Use the built-in `date` and `titlecase` pipes.

## In this repo

- `shared/directives/highlight-overdue.ts`, `autofocus.ts`, `feature-flag.ts`; `shared/pipes/relative-date.pipe.ts`, `priority-label.pipe.ts`.
- `RelativeDatePipe` uses `inject(LOCALE_ID)` and switches to weeks and months for far dates. `PriorityLabelPipe` returns translated labels without emojis.
- `HighlightOverdueDirective` is applied in the templates (task row, form date input) rather than through `hostDirectives`.

## Further reading

- [Attribute directives](https://angular.dev/guide/directives/attribute-directives)
- [Structural directives](https://angular.dev/guide/directives/structural-directives)
- [Directive composition API (`hostDirectives`)](https://angular.dev/guide/directives/directive-composition-api)
- [Pipes](https://angular.dev/guide/templates/pipes)
