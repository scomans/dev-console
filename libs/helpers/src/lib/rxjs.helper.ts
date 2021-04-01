import { defer, from, MonoTypeOperatorFunction, Observable, ObservableInput, ObservedValueOf, of, OperatorFunction, Subscription } from 'rxjs';
import { filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';


export function debug<T>(tag: string): MonoTypeOperatorFunction<T> {
  return tap<T>({
    next(value) {
      console.log(`%c[${tag}: Next]`, 'background: #009688; color: #fff; padding: 3px; font-size: 9px;', value);
    },
    error(error) {
      console.log(`%c[${tag}: Error]`, 'background: #E91E63; color: #fff; padding: 3px; font-size: 9px;', error);
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

export function isIn<T>(...v1: T[]): OperatorFunction<T, boolean> {
  return map<T, boolean>((v2: T) => {
    return v1.indexOf(v2) !== -1;
  });
}

export function switchFilterMap<T, O extends ObservableInput<any>>(
  filterPredicate: (value: T, index: number) => boolean,
  project: (value: T, index: number) => O,
): OperatorFunction<T, ObservedValueOf<O>> {
  return (input) => {
    return new Observable<ObservedValueOf<O>>(subscriber => {

      let count: number = 0;

      let innerSubscribtion: Subscription = Subscription.EMPTY;
      input.subscribe({
        next(value) {
          innerSubscribtion.unsubscribe();
          if (filterPredicate(value, count++)) {
            innerSubscribtion = from(project(value, count))
              .subscribe({
                next(value: ObservedValueOf<O>) {
                  subscriber.next(value);
                },
                error(error) {
                  subscriber.error(error);
                },
                complete() {
                  subscriber.complete();
                },
              });
          }
        },
        error(error) {
          subscriber.error(error);
        },
        complete() {
          innerSubscribtion.unsubscribe();
          subscriber.complete();
        },
      });
    });
  };
}

export function takeWhileActive<T, O extends Observable<boolean>>(filterObservable: O): MonoTypeOperatorFunction<T> {
  return (input) => {
    return input.pipe(
      withLatestFrom(filterObservable),
      filter(([, isActive]) => !!isActive),
      map(([value]) => value),
    );
  };
}

export function mapLatestFrom<T, O extends ObservableInput<any>>(project: O): OperatorFunction<T, ObservedValueOf<O>> {
  return (input): Observable<ObservedValueOf<O>> => {
    return input.pipe(
      withLatestFrom(project),
      map(([, value]) => value),
    );
  };
}

export function doOnSubscribe<T>(onSubscribe: () => void): MonoTypeOperatorFunction<T> {
  return function inner(source: Observable<T>): Observable<T> {
    return defer(() => {
      onSubscribe();
      return source;
    });
  };
}

export function tapOnce<T>(callback: (value: T) => void): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => of({}).pipe(tap(callback), switchMap(() => source));
}
