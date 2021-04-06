import { from, isObservable, of } from 'rxjs';
import { isPromise } from './promise.helper';

export function observify(asyncOrValue: any) {
  if (isPromise(asyncOrValue) || isObservable(asyncOrValue)) {
    return from(asyncOrValue);
  }

  return of(asyncOrValue);
}
