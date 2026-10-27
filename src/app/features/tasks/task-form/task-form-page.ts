import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { Priority, Task } from '../../../core/models/task';
import { ProjectStore } from '../../../core/services/project-store';
import { TaskStore } from '../../../core/services/task-store';
import { PrioritySelectorComponent } from '../../../shared/components/priority-selector/priority-selector';
import { notInThePast } from '../../../shared/validators/not-in-the-past';
import {
  highPriorityNeedsDate,
  uniqueTitleValidator,
} from '../../../shared/validators/task-validators';

/** An existing past date may stay as it is (editing an overdue task); a newly picked one may not. */
const newDateNotInThePast: ValidatorFn = (control) =>
  control.pristine ? null : notInThePast(control);

@Component({
  selector: 'app-task-form-page',
  imports: [ReactiveFormsModule, RouterLink, PrioritySelectorComponent],
  templateUrl: './task-form-page.html',
  styleUrl: './task-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormPage implements HasUnsavedChanges {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(TaskStore);
  private readonly router = inject(Router);
  protected readonly projects = inject(ProjectStore).projects;

  readonly id = input<string>(); // from /tasks/:id; undefined on /tasks/new
  readonly task = input<Task>(); // from the resolver's `task` key

  protected readonly isEdit = computed(() => this.id() !== undefined);
  private saved = false;

  protected readonly form = this.fb.group(
    {
      title: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
        asyncValidators: [uniqueTitleValidator(this.store.tasks, () => this.task()?.id)],
      }),
      description: ['', Validators.maxLength(1000)],
      priority: this.fb.control<Priority>('medium'),
      dueDate: ['', newDateNotInThePast],
      projectId: [this.projects()[0]?.id ?? '', Validators.required],
      tags: this.fb.array<string>([]),
    },
    { validators: highPriorityNeedsDate },
  );

  constructor() {
    // One form for create and edit: fill it when the resolved task arrives
    effect(() => {
      const task = this.task();
      if (!task) return;
      untracked(() => {
        this.tags.clear({ emitEvent: false });
        task.tags.forEach((tag) => this.addTag(tag));
        this.form.reset({
          title: task.title,
          description: task.description ?? '',
          priority: task.priority,
          dueDate: task.dueDate ?? '',
          projectId: task.projectId,
          tags: task.tags,
        });
      });
    });

    // The title is unique per project, so check it again when the project changes
    this.form.controls.projectId.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.form.controls.title.updateValueAndValidity());
  }

  protected get tags() {
    return this.form.controls.tags;
  }

  protected addTag(value = ''): void {
    this.tags.push(this.fb.control(value, [Validators.required, Validators.maxLength(30)]));
  }

  protected removeTag(index: number): void {
    this.tags.removeAt(index);
    this.tags.markAsDirty();
  }

  protected save(): void {
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched(); // show every error
      return;
    }
    const value = this.form.getRawValue();
    const changes = {
      title: value.title.trim(),
      description: value.description.trim() || undefined,
      priority: value.priority,
      dueDate: value.dueDate || undefined,
      projectId: value.projectId,
      tags: [...new Set(value.tags.map((tag) => tag.trim()).filter(Boolean))],
    };
    const task = this.task();
    if (task) this.store.update(task.id, changes);
    else this.store.add(changes);
    this.saved = true;
    void this.router.navigate(['/tasks']);
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saved;
  }
}
