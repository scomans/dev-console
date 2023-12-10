import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { SafeAny } from '@dev-console/types';
import { toSignal } from '@angular/core/rxjs-interop';

export function isFormInvalid(formGroup: FormGroup<SafeAny>) {
  return toSignal(formGroup.invalid$, { initialValue: formGroup.invalid });
}

export function isFormControlDirty(formControl: FormControl<SafeAny>) {
  return toSignal(formControl.dirty$, { initialValue: formControl.dirty });
}
