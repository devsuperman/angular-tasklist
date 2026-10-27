import { ChangeDetectionStrategy, Component, ElementRef, output, viewChild } from '@angular/core';
import { AutofocusDirective } from '../../../shared/directives/autofocus';

@Component({
  selector: 'app-add-task',
  imports: [AutofocusDirective],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTaskComponent {
  readonly added = output<string>();

  private readonly titleInput = viewChild.required<ElementRef<HTMLInputElement>>('titleInput');

  protected add(): void {
    const input = this.titleInput().nativeElement;
    const title = input.value.trim();
    if (title) {
      this.added.emit(title);
      input.value = '';
    }
    input.focus(); // ready for the next task
  }
}
