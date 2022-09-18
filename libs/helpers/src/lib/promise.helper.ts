export function sleep(ms): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface DeferredPromise<T> extends Promise<T> {
  resolve(value?: T | PromiseLike<T>);

  reject(value?);
}

/**
 * Creates a promise that can be resolved/rejected from outside the promise
 */
export function createDeferredPromise<T>(
  executor?: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void,
) {
  let _resolve: (value?: T | PromiseLike<T>) => void = null;
  let _reject = null;

  const promise: DeferredPromise<T> = new Promise<T>((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;

    if (executor) {
      executor(resolve, reject);
    }
  }) as DeferredPromise<T>;

  promise.resolve = _resolve;
  promise.reject = _reject;

  return promise;
}
