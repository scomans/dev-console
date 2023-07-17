import { isNil } from 'lodash';

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @param executor The executor function.
 */
export class CancelToken {
  promise: Promise<void>;
  reason: string;

  constructor(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.');
    }

    let resolvePromise;
    this.promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const token = this;
    executor((message) => {
      if (this.reason) {
        // Cancellation has already been requested
        return;
      }

      token.reason = message;
      resolvePromise(token.reason);
    });
  }

  /**
   * Throws a `Cancel` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw new CancelException(this.reason);
    }
  }

  isCancelled() {
    return !isNil(this.reason);
  }

  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static build() {
    let cancel: (message: string) => void;
    const token = new CancelToken((c) => cancel = c);
    return {
      token: token,
      cancel: cancel,
    };
  }
}

export class CancelException extends Error {

  constructor(message: string) {
    super(message);
  }
}
