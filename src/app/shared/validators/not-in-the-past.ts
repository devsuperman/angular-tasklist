import { AbstractControl, ValidationErrors } from '@angular/forms';
import { todayIso } from '../../core/utils/date';

/** Rejects ISO dates before today. Empty is fine: use `Validators.required` to forbid it. */
export function notInThePast(control: AbstractControl<string | null>): ValidationErrors | null {
  if (!control.value) return null;
  return control.value < todayIso() ? { pastDate: true } : null;
}
