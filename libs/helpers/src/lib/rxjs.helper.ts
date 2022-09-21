import { defer, MonoTypeOperatorFunction, Observable, OperatorFunction } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';


export function debug<T>(tag: string): MonoTypeOperatorFunction<T> {
  return tap<T>({
    next(value) {
      console.log(`%c[${ tag }: Next]`, 'background: #009688; color: #fff; padding: 3px; font-size: 9px;', value);
    },
    error(error) {
      console.log(`%c[${ tag }: Error]`, 'background: #E91E63; color: #fff; padding: 3px; font-size: 9px;', error);
    },
    complete() {
      console.log(`%c[${tag}: Complete]`, 'background: #00BCD4; color: #fff; padding: 3px; font-size: 9px;');
    },
  });
}

export function filterNil<T>(): MonoTypeOperatorFunction<T> {
  return filter<T>(value => value !== undefined && value !== null);
}

export function equals<T>(v1: T, strict: boolean = true): OperatorFunction<T, boolean> {
  return map<T, boolean>((v2: T) => {
    // tslint:disable-next-line:triple-equals
    return strict ? v1 === v2 : v1 == v2;
  });
}

export function doOnSubscribe<T>(onSubscribe: () => void): MonoTypeOperatorFunction<T> {
  return function inner(source: Observable<T>): Observable<T> {
    return defer(() => {
      onSubscribe();
      return source;
    });
  };
}
