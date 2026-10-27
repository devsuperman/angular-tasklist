import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Project } from '../../../core/models/project';

let nextId = 0;

/** Template-driven form (ngModel), to compare with the reactive task form. */
@Component({
  selector: 'app-project-form',
  imports: [FormsModule],
  templateUrl: './project-form.html',
  styleUrl: './project-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormComponent {
  /** The project to rename, or undefined to create one. */
  readonly project = input<Project>();
  readonly saved = output<Omit<Project, 'id'>>();
  readonly cancelled = output<void>();

  protected readonly uid = `project-${nextId++}`;
  // Start from the project's values, but stay writable for ngModel
  protected readonly name = linkedSignal(() => this.project()?.name ?? '');
  protected readonly color = linkedSignal(() => this.project()?.color ?? '#2563eb');

  protected save(form: NgForm): void {
    if (form.invalid) return;
    this.saved.emit({ name: this.name().trim(), color: this.color() });
    if (!this.project()) form.resetForm({ name: '', color: this.color() });
  }
}
