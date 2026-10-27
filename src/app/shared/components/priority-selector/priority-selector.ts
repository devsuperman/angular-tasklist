import { ChangeDetectionStrategy, Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PRIORITIES, Priority } from '../../../core/models/task';
import { PriorityLabelPipe } from '../../pipes/priority-label.pipe';

let nextId = 0;

/** A radio group that works with `formControlName` and `ngModel`, like a native input. */
@Component({
  selector: 'app-priority-selector',
  imports: [PriorityLabelPipe],
  templateUrl: './priority-selector.html',
  styleUrl: './priority-selector.scss',
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
  protected readonly options = PRIORITIES;
  protected readonly name = `priority-${nextId++}`;
  protected readonly value = signal<Priority>('medium');
  protected readonly disabled = signal(false);

  private onChange: (value: Priority) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: Priority | null): void {
    this.value.set(value ?? 'medium');
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

  protected select(option: Priority): void {
    this.value.set(option);
    this.onChange(option);
  }
}
