import { isFunction } from '@datorama/akita';

export function isPromise(v: any) {
  return v && isFunction(v.then);
}
