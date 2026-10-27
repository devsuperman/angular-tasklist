# Chapter 7 — Forms

**Phase 5** (F2 · create / edit / delete task, F6 · projects) · Concepts: reactive forms, typed forms, `NonNullableFormBuilder`, `FormGroup` / `FormControl` / `FormArray`, built-in, custom, async and cross-field validators, form state (`dirty`, `touched`, `valid`), `ControlValueAccessor`, template-driven forms (`ngModel`), Signal Forms (optional).

---

## 7.1 Why forms need a framework

A plain `<input>` gives you a string. A real form needs more: a typed value for each field, validation rules and messages, "has the user touched this yet?", "is anything changed?", disabling Save while invalid, and filling the form for editing. Angular forms give you a **model** of the form that tracks all of this.

Angular has three ways to build forms:

| Approach            | Model lives in           | Best for                               | Used here for                      |
| ------------------- | ------------------------ | -------------------------------------- | ---------------------------------- |
| **Reactive forms**  | The class (`FormGroup`)  | Complex forms, dynamic fields, testing | Task form (Phase 5)                |
| **Template-driven** | The template (`ngModel`) | Small, simple forms                    | Project form (Phase 5), to compare |
| **Signal Forms**    | A signal (`form()`)      | New, signal-native API (experimental)  | Optional rebuild of the task form  |

---

## 7.2 Reactive, typed forms

### What

You build a tree of controls in TypeScript and bind it to the template.

- `FormControl<T>`: one value.
- `FormGroup<{...}>`: an object of controls.
- `FormArray<FormControl<T>>`: a list of controls whose length can change.

Since Angular 14 forms are **typed**: `form.value.title` is a `string`, and `form.controls.priority.setValue('urgent')` is a compile error.

### Why `NonNullableFormBuilder`

By default, `control.reset()` sets the value to `null`, so every control's type is `T | null`. With `NonNullableFormBuilder`, `reset()` goes back to the **initial** value, and types stay `string` instead of `string | null`.

### How it is applied here

🟢 **Built (Phase 5)**: `features/tasks/task-form-page.ts`

```ts
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-task-form-page',
  imports: [ReactiveFormsModule, PrioritySelectorComponent],
  templateUrl: './task-form-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormPage implements HasUnsavedChanges {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(TaskStore);
  private readonly router = inject(Router);

  readonly task = input<Task>(); // from the resolver (Chapter 6); undefined on /tasks/new
  protected readonly isEdit = computed(() => !!this.task());
  private saved = false;

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: [''],
    priority: this.fb.control<Priority>('medium'),
    dueDate: ['', notInThePast],
    projectId: ['', Validators.required],
    tags: this.fb.array<string>([]),
  });

  constructor() {
    // Fill the form when editing (one form for create and edit)
    effect(() => {
      const task = this.task();
      if (!task) return;
      this.form.reset({
        ...task,
        description: task.description ?? '',
        dueDate: task.dueDate ?? '',
      });
      this.form.controls.tags.clear();
      task.tags.forEach((tag) => this.addTag(tag));
    });
  }

  protected get tags() {
    return this.form.controls.tags;
  }

  protected addTag(value = '') {
    this.tags.push(this.fb.control(value, Validators.required));
  }

  protected removeTag(index: number) {
    this.tags.removeAt(index);
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // show every error
      return;
    }
    const value = this.form.getRawValue();
    const changes = { ...value, dueDate: value.dueDate || undefined };
    const task = this.task();
    if (task) this.store.update(task.id, changes);
    else this.store.add(changes);
    this.saved = true;
    this.router.navigate(['/tasks']);
  }

  hasUnsavedChanges() {
    return this.form.dirty && !this.saved;
  }
}
```

```html
<!-- task-form-page.html -->
<form [formGroup]="form" (ngSubmit)="save()">
  <label for="title">Title</label>
  <input id="title" formControlName="title" />
  @let title = form.controls.title;
  @if (title.invalid && title.touched) {
    <p class="error" role="alert">
      @if (title.hasError('required')) { The title is required. }
      @else if (title.hasError('minlength')) { Use at least 3 characters. }
    </p>
  }

  <label for="description">Description</label>
  <textarea id="description" formControlName="description"></textarea>

  <app-priority-selector formControlName="priority" />

  <label for="dueDate">Due date</label>
  <input id="dueDate" type="date" formControlName="dueDate" />
  @if (form.controls.dueDate.hasError('pastDate')) {
    <p class="error" role="alert">The due date cannot be in the past.</p>
  }

  <fieldset formArrayName="tags">
    <legend>Tags</legend>
    @for (tag of tags.controls; track tag; let i = $index) {
      <input [formControlName]="i" [attr.aria-label]="'Tag ' + (i + 1)" />
      <button type="button" (click)="removeTag(i)">Remove</button>
    }
    <button type="button" (click)="addTag()">Add tag</button>
  </fieldset>

  <button type="submit" [disabled]="form.invalid || form.pending">
    {{ isEdit() ? 'Save' : 'Create' }}
  </button>
</form>
```

Key ideas:

- `[formGroup]` binds the group; `formControlName` binds a field by name; `formArrayName` + `[formControlName]="i"` bind array items.
- **`getRawValue()`** returns the full, typed value (including disabled controls). `form.value` skips disabled controls, so its fields are optional.
- **One form for create and edit**: the only difference is whether `task()` has a value. `reset(task)` fills the form _and_ marks it pristine, so `dirty` means "changed by the user".
- `track tag` tracks the `FormControl` object itself, which is stable for each item.

### Control state

| Property                | Meaning                                          | Typical use                           |
| ----------------------- | ------------------------------------------------ | ------------------------------------- |
| `valid` / `invalid`     | Passes all validators                            | Disable the Save button               |
| `pending`               | An async validator is running                    | Show "checking..."                    |
| `touched` / `untouched` | The user focused and left the field              | Show errors only after the user tried |
| `dirty` / `pristine`    | The user changed the value                       | The unsaved-changes guard (Chapter 6) |
| `errors`                | `{ required: true, minlength: {...} }` or `null` | Choose the message                    |

Angular also adds CSS classes on the elements (`ng-invalid`, `ng-touched`, `ng-dirty`), handy for styling: `input.ng-invalid.ng-touched { border-color: red; }`.

---

## 7.3 Validators

### Built-in

`Validators.required`, `requiredTrue`, `minLength`, `maxLength`, `min`, `max`, `email`, `pattern`.

### Custom sync validator

A validator is a function: it receives a control and returns `null` (valid) or an errors object.

🟢 **Built (Phase 5)**: `shared/validators/not-in-the-past.ts`

```ts
import { AbstractControl, ValidationErrors } from '@angular/forms';

export function notInThePast(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value) return null; // empty is fine; use Validators.required to forbid it
  const today = new Date().toISOString().slice(0, 10);
  return control.value < today ? { pastDate: true } : null;
}
```

Comparing `'YYYY-MM-DD'` strings works because that format sorts like the dates it represents. (Beware: `toISOString()` is UTC; near midnight "today" may differ from the user's local date. A good thing to fix and test in Phase 9.)

> Should editing an old, overdue task fail validation? Probably not. One option: only apply `notInThePast` when creating. Decisions like this are part of learning forms.

### Async validator

An async validator returns a `Promise` or `Observable`. While it runs, the control is `pending`.

🟢 **Built (Phase 5)**: the title must be unique within the project.

```ts
export function uniqueTitleValidator(
  store: TaskStore,
  currentId: () => string | undefined,
): AsyncValidatorFn {
  return (control) => {
    const title = (control.value as string).trim().toLowerCase();
    const projectId = control.parent?.get('projectId')?.value;
    const taken = store
      .tasks()
      .some(
        (t) => t.id !== currentId() && t.projectId === projectId && t.title.toLowerCase() === title,
      );
    return of(taken ? { titleTaken: true } : null);
  };
}
```

Here the data is in memory, so it does not _need_ to be async. It is async on purpose, to learn `pending` and how async validators run **only after** sync validators pass. With a real server it would be an HTTP call, usually with `debounceTime`.

### Cross-field validator

A validator on the **group** can compare fields. For example, "a high-priority task must have a due date":

```ts
export const highPriorityNeedsDate: ValidatorFn = (group) => {
  const { priority, dueDate } = group.value;
  return priority === 'high' && !dueDate ? { dueDateRequiredForHigh: true } : null;
};

this.fb.group({ ... }, { validators: highPriorityNeedsDate });
```

The error is on the **group** (`form.hasError('dueDateRequiredForHigh')`), not on a field.

---

## 7.4 `ControlValueAccessor`: your own form control

### What

`ControlValueAccessor` (CVA) is the interface that lets **your component** work with `formControlName` and `ngModel`, exactly like a native `<input>`.

| Method                  | Called by Angular when...                              |
| ----------------------- | ------------------------------------------------------ |
| `writeValue(v)`         | the form sets a value (initial, `reset`, `setValue`)   |
| `registerOnChange(fn)`  | at setup: call `fn(newValue)` when the user changes it |
| `registerOnTouched(fn)` | at setup: call `fn()` when the user leaves the control |
| `setDisabledState(b)`   | the control is disabled or enabled                     |

### Why

The priority field is better as three buttons (Low / Medium / High) than a `<select>`. Without CVA, you would wire inputs and outputs by hand and lose validation, `dirty` and `touched`. With CVA, the parent just writes `formControlName="priority"`.

### How it is applied here

🟢 **Built (Phase 5)**: `shared/components/priority-selector/priority-selector.ts`

```ts
@Component({
  selector: 'app-priority-selector',
  template: `
    <fieldset>
      <legend>Priority</legend>
      @for (option of options; track option) {
        <label>
          <input
            type="radio"
            name="priority"
            [value]="option"
            [checked]="value() === option"
            [disabled]="disabled()"
            (change)="select(option)"
            (blur)="onTouched()"
          />
          {{ option }}
        </label>
      }
    </fieldset>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PrioritySelectorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrioritySelectorComponent implements ControlValueAccessor {
  protected readonly options: Priority[] = ['low', 'medium', 'high'];
  protected readonly value = signal<Priority>('medium');
  protected readonly disabled = signal(false);

  private onChange: (value: Priority) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: Priority): void {
    this.value.set(value);
  }
  registerOnChange(fn: (value: Priority) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected select(option: Priority) {
    this.value.set(option);
    this.onChange(option);
  }
}
```

Notes:

- `NG_VALUE_ACCESSOR` is an `InjectionToken` (Chapter 5). `multi: true` means many providers can add to the same token. `useExisting` + `forwardRef` points it at this component instance (the class is not defined yet when the decorator runs, hence `forwardRef`).
- Internal state is in signals, so `OnPush` works when Angular calls `writeValue`.

---

## 7.5 Template-driven forms

### What

The model lives in the template with `[(ngModel)]`. Angular creates the `FormControl`s for you behind the scenes.

🟢 **Built (Phase 5)**: the project form, to compare.

```ts
@Component({
  selector: 'app-project-form',
  imports: [FormsModule],
  template: `
    <form #projectForm="ngForm" (ngSubmit)="save(projectForm)">
      <label for="name">Name</label>
      <input id="name" name="name" [(ngModel)]="name" required minlength="2" #nameCtrl="ngModel" />
      @if (nameCtrl.invalid && nameCtrl.touched) {
        <p class="error" role="alert">The name needs at least 2 characters.</p>
      }

      <label for="color">Color</label>
      <input id="color" name="color" type="color" [(ngModel)]="color" />

      <button type="submit" [disabled]="projectForm.invalid">Save</button>
    </form>
  `,
})
export class ProjectFormComponent {
  protected readonly name = signal('');
  protected readonly color = signal('#3b82f6');
  ...
}
```

- Every `ngModel` field needs a `name` attribute.
- Validators are HTML attributes (`required`, `minlength`).
- `#nameCtrl="ngModel"` exports the control so the template can read its state.
- `[(ngModel)]` works with signals: pass the signal itself.

### Reactive vs template-driven

|                              | Reactive   | Template-driven  |
| ---------------------------- | ---------- | ---------------- |
| Where the model is           | Class      | Template         |
| Typed                        | Yes, fully | Partly           |
| Dynamic fields (`FormArray`) | Easy       | Awkward          |
| Custom validators            | Functions  | Need a directive |
| Unit testing without DOM     | Easy       | Harder           |
| Code for a tiny form         | More       | Less             |

That is the comparison Phase 5 asks you to write in NOTES.md.

---

## 7.6 Signal Forms (optional)

Angular also has **Signal Forms** (`@angular/forms/signals`, experimental at the time of writing): the form model is a signal, and fields are bound with the `[formField]` directive. The main idea:

```ts
import { form, required, minLength, FormField } from '@angular/forms/signals';

protected readonly model = signal({ title: '', priority: 'medium' as Priority });
protected readonly taskForm = form(this.model, (path) => {
  required(path.title, { message: 'The title is required.' });
  minLength(path.title, 3);
});
```

```html
<input [formField]="taskForm.title" />
@if (taskForm.title().invalid() && taskForm.title().touched()) { ... }
```

Because it is experimental, the API may change: check [angular.dev](https://angular.dev/guide/forms/signals/overview) before you try it. TASKS.md lists it as optional: rebuild the task form with it at the end of Phase 5, then compare.

---

## Pitfalls

- **Forgetting `ReactiveFormsModule` / `FormsModule` in `imports`**: "Can't bind to 'formGroup'".
- **Showing errors before the user did anything**: check `touched` (or call `markAllAsTouched()` on submit).
- **Using `form.value` instead of `getRawValue()`**: disabled fields disappear.
- **`patchValue` vs `reset`** when editing: `patchValue` changes values but leaves `dirty` and `touched` as they were; `reset` sets the values and makes the form pristine and untouched.
- **Mixing `ngModel` and `formControlName` on the same element**: pick one approach per form.

## Try it yourself

1. Build the task form with `NonNullableFormBuilder`. Check that `form.getRawValue()` has no `null` in its type.
2. Show messages for `required` and `minlength` only after the field is touched.
3. Write `notInThePast` and a unit test for it (Chapter 11).
4. Add tags with `FormArray`.
5. Use the same page for `/tasks/new` and `/tasks/:id`.
6. Write the `PrioritySelectorComponent` CVA and use it with `formControlName`. Check that touching it marks the control `touched`.
7. Wire `unsavedChangesGuard` and test it by editing and pressing Back.
8. Build the project form with `ngModel` and write the comparison in NOTES.md.

## In this repo

- `features/tasks/task-form/task-form-page.ts` and `.html`. Differences from the sketch:
  - the due date validator only runs on a **dirty** control, so an overdue task can still be edited;
  - `highPriorityNeedsDate` is used, as a group validator;
  - the async validator lives in `shared/validators/task-validators.ts`, takes a function that returns the tasks, waits 150 ms (to show `pending`), and runs again when the project changes.
- `shared/validators/not-in-the-past.ts`, `shared/components/priority-selector/`.
- `features/projects/project-form/`: template-driven, with `linkedSignal` fields so the same form can create and rename.
- Not done: the optional Signal Forms version.

## Further reading

- [Forms overview](https://angular.dev/guide/forms)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms) and [typed forms](https://angular.dev/guide/forms/typed-forms)
- [Form validation](https://angular.dev/guide/forms/form-validation)
- [Template-driven forms](https://angular.dev/guide/forms/template-driven-forms)
- [Signal Forms](https://angular.dev/guide/forms/signals/overview)
