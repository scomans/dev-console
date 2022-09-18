import axiosPkg from 'axios';
import * as axiosHttpAdapter from 'axios/lib/adapters/http';
import * as https from 'https';
import { isBoolean, isEmpty, negate, once, pick, zip } from 'lodash';
import { connect } from 'net';
import { combineLatest, from, merge, NEVER, throwError, timer } from 'rxjs';
import { distinctUntilChanged, map, mergeMap, scan, startWith, switchMap, take, takeWhile } from 'rxjs/operators';
import { CancelToken } from './cancel.helper';
import { getFileSize } from './fs.helper';

// force http adapter for axios, otherwise if using jest/jsdom xhr might
// be used and it logs all errors polluting the logs
const axios = axiosPkg.create({ adapter: axiosHttpAdapter });
const isNotABoolean = negate(isBoolean);
const isNotEmpty = negate(isEmpty);
const PREFIX_RE = /^((https?-get|https?|tcp|socket|file):)(.+)$/;
const HOST_PORT_RE = /^(([^:]*):)?(\d+)$/;
const HTTP_GET_RE = /^https?-get:/;
const HTTP_UNIX_RE = /^http:\/\/unix:([^:]+):([^:]+)$/;
const TIMEOUT_ERR_MSG = 'Timed out waiting for';

export class TimeoutException extends Error {

  constructor(message: string) {
    super(message);
  }
}

export class CancelException extends Error {

  constructor(message: string) {
    super(message);
  }
}

export interface WaitOnOptions {
  /**
   * Array of string resources to wait for. prefix determines the type of resource with the default type of file:
   */
  resources: string[];
  /**
   * Initial delay in ms.
   * @default 0
   */
  delay?: number;
  /**
   * Poll resource interval in ms,
   * @default 250ms
   */
  interval?: number;
  /**
   * Flag which outputs to stdout, remaining resources waited on and when complete or any error occurs.
   */
  log?: boolean;
  /**
   * Flag to reverse operation so checks are for resources being NOT available.
   * @default false
   */
  reverse?: boolean;
  /**
   * Timeout in ms until it aborts with error.
   * @default Infinity
   */
  timeout?: number;
  /**
   * http HEAD/GET timeout to wait for request
   * @default 0
   */
  httpTimeout?: number;
  /**
   * Tcp timeout in ms.
   * @default 300
   */
  tcpTimeout?: number;
  /**
   * Flag which outputs debug output.
   * @default false
   */
  verbose?: boolean;
  /**
   * Stabilization time in ms
   * Waits this amount of time for file sizes to stabilize or other resource availability to remain unchanged.
   * @default 750ms.
   */
  window?: number;
  /**
   * Limit of concurrent connections to a resource
   * @default Infinity
   */
  simultaneous?: number;
  /**
   * Https specific option.
   * see https://github.com/request/request#readme for specific details
   */
  auth?: WaitOnAuth;
  /**
   * Validates whether a status is valid.
   */
  validateStatus?: ValidateStatus;
  /**
   * Proxy options.
   * see https://github.com/axios/axios#config-defaults
   */
  proxy?: AxiosProxyConfig;
  strictSSL?: boolean;
  followRedirect?: boolean;
  headers?: Record<string, any>;
}

export interface WaitOnAuth {
  username: string;
  password: string;
}

export type ValidateStatus = (status: number) => boolean;

export interface AxiosProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
  protocol?: string;
}

export function waitOn(opts: WaitOnOptions, cancel?: CancelToken) {
  return new Promise<void>(function (resolve, reject) {
    waitOnImpl(opts, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }, cancel);
  });
}

function waitOnImpl(opts: WaitOnOptions, cbFunc: (err: any) => void, cancel?: CancelToken) {
  const cbOnce = once(cbFunc);
  const validatedOpts: WaitOnOptions = {
    delay: 0,
    interval: 250,
    log: false,
    reverse: false,
    simultaneous: Infinity,
    timeout: Infinity,
    verbose: false,
    window: 750,
    tcpTimeout: 300,
    strictSSL: false,
    followRedirect: true,


    ...opts, // use defaults
    // window needs to be at least interval
    ...(opts.window < opts.interval ? { window: opts.interval } : {}),
    ...(opts.verbose ? { log: true } : {}), // if debug logging then normal log is also enabled
  };

  const { resources, timeout, reverse } = validatedOpts;
  let lastResourcesState = resources; // the last state we had recorded

  function cleanup(err?) {
    if (err) {
      if (err.message.startsWith(TIMEOUT_ERR_MSG)) {
        console.log('wait-on(%s) %s; exiting with error', process.pid, err.message);
      } else {
        console.log('wait-on(%s) exiting with error', process.pid, err);
      }
    } else {
      // no error, we are complete
      console.log('wait-on(%s) complete', process.pid);
    }
    cbOnce(err);
  }

  if (reverse) {
    console.log('wait-on reverse mode - waiting for resources to be unavailable');
  }
  // logWaitingFor(resources, []);

  const resourcesCompleted$ = combineLatest(resources.map(ressource => createResource$(validatedOpts, ressource)));
  const cancelIssued$ = cancel ? from(cancel?.promise).pipe(switchMap(() => throwError(new CancelException(cancel.reason)))) : NEVER;
  const timeoutError$ =
    timeout !== Infinity ?
      timer(timeout).pipe(
        mergeMap(() => {
          const resourcesWaitingFor = determineRemainingResources(resources, lastResourcesState).join(', ');
          return throwError(new TimeoutException(`${TIMEOUT_ERR_MSG}: ${resourcesWaitingFor}`));
        }),
      ) :
      NEVER;

  merge(timeoutError$, resourcesCompleted$, cancelIssued$)
    .pipe(
      takeWhile((resourceStates) => resourceStates.some((x) => !x)),
    )
    .subscribe({
      next: (resourceStates: string[]) => {
        lastResourcesState = resourceStates;
        logWaitingFor(resources, resourceStates);
      },
      error: cleanup,
      complete: cleanup,
    });
}

function logWaitingFor(resources, resourceStates) {
  const remainingResources = determineRemainingResources(resources, resourceStates);
  if (isNotEmpty(remainingResources)) {
    console.log(`waiting for ${remainingResources.length} resources: ${remainingResources.join(', ')}`);
  }
}

function determineRemainingResources(resources, resourceStates) {
  // resourcesState is array of completed booleans
  const resourceAndStateTuples = zip(resources, resourceStates);
  return resourceAndStateTuples.filter(([, /* r */ s]) => !s).map(([r /*, s */]) => r);
}

function createResource$(opts: WaitOnOptions, resource) {
  const prefix = extractPrefix(resource);
  switch (prefix) {
    case 'https-get:':
    case 'http-get:':
    case 'https:':
    case 'http:':
      return createHTTP$(opts, resource);
    case 'tcp:':
      return createTCP$(opts, resource);
    case 'socket:':
      return createSocket$(opts, resource);
    default:
      return createFileResource$(opts, resource);
  }
}

function createFileResource$({ delay, interval, reverse, simultaneous, window: stabilityWindow }: WaitOnOptions, resource: string) {
  const filePath = extractPath(resource);
  const checkOperator = reverse
    ? map((size) => size === -1) // check that file does not exist
    : scan(
      // check that file exists and the size is stable
      (acc, x) => {
        if (x > -1) {
          const { size, t } = acc;
          const now = Date.now();
          if (size !== -1 && x === size) {
            if (now >= t + stabilityWindow) {
              // file size has stabilized
              return true;
            }
            return acc; // return acc unchanged, just waiting to pass stability window
          }
          return { size: x, t: now }; // update acc with new value and timestamp
        }
        return acc;
      },
      { size: -1, t: Date.now() },
    );

  return timer(delay, interval).pipe(
    mergeMap(() => from(getFileSize(filePath)), simultaneous),
    checkOperator as any,
    map((x) => (isNotABoolean(x) ? false : x)),
    startWith(false),
    distinctUntilChanged(),
    take(2),
  );
}

function extractPath(resource: string) {
  const m = PREFIX_RE.exec(resource);
  if (m) {
    return m[3];
  }
  return resource;
}

function extractPrefix(resource) {
  const m = PREFIX_RE.exec(resource);
  if (m) {
    return m[1];
  }
  return '';
}

function createHTTP$(opts: WaitOnOptions, resource: string) {
  const { delay, followRedirect, httpTimeout: timeout, interval, proxy, reverse, simultaneous, strictSSL: rejectUnauthorized } = opts;
  const method = HTTP_GET_RE.test(resource) ? 'get' : 'head';
  const url = resource.replace('-get:', ':');
  const matchHttpUnixSocket = HTTP_UNIX_RE.exec(url); // http://unix:/sock:/url
  const urlSocketOptions = matchHttpUnixSocket ? { socketPath: matchHttpUnixSocket[1], url: matchHttpUnixSocket[2] } : { url };
  const httpOptions = {
    ...pick(opts, ['auth', 'headers', 'validateStatus']),
    httpsAgent: new https.Agent({
      rejectUnauthorized,
      ...pick(opts, ['ca', 'cert', 'key', 'passphrase']),
    }),
    ...(followRedirect ? {} : { maxRedirects: 0 }), // defaults to 5 (enabled)
    proxy, // can be undefined, false, or object
    ...(timeout && { timeout }),
    ...urlSocketOptions,
    method,
    // by default it provides full response object
    // validStatus is 2xx unless followRedirect is true (default)
  };
  const checkFn = reverse ? negateAsync(httpCallSucceeds) : httpCallSucceeds;
  return timer(delay, interval).pipe(
    mergeMap(() => from(checkFn(httpOptions)), simultaneous),
    startWith(false),
    distinctUntilChanged(),
    take(2),
  );
}

async function httpCallSucceeds(httpOptions) {
  try {
    await axios(httpOptions);
    return true;
  } catch (err) {
    return false;
  }
}

function createTCP$({ delay, interval, tcpTimeout, reverse, simultaneous }: WaitOnOptions, resource: string) {
  const tcpPath = extractPath(resource);
  const checkFn = reverse ? negateAsync(tcpExists) : tcpExists;
  return timer(delay, interval).pipe(
    mergeMap(() => from(checkFn(tcpPath, tcpTimeout)), simultaneous),
    startWith(false),
    distinctUntilChanged(),
    take(2),
  );
}

async function tcpExists(tcpPath, tcpTimeout) {
  const [/* full */, /* hostWithColon */, hostMatched, port] = HOST_PORT_RE.exec(tcpPath);
  const host = hostMatched || 'localhost';
  return new Promise((resolve) => {
    const conn = connect(parseInt(port), host)
      .on('error', () => resolve(false))
      .on('timeout', () => {
        conn.end();
        resolve(false);
      })
      .on('connect', () => {
        conn.end();
        resolve(true);
      });
    conn.setTimeout(tcpTimeout);
  });
}

function createSocket$({ delay, interval, reverse, simultaneous }: WaitOnOptions, resource: string) {
  const socketPath = extractPath(resource);
  const checkFn = reverse ? negateAsync(socketExists) : socketExists;
  return timer(delay, interval).pipe(
    mergeMap(() => from(checkFn(socketPath)), simultaneous),
    startWith(false),
    distinctUntilChanged(),
    take(2),
  );
}

async function socketExists(socketPath) {
  return new Promise((resolve) => {
    const conn = connect(socketPath)
      .on('error', () => resolve(false))
      .on('connect', () => {
        conn.end();
        resolve(true);
      });
  });
}

function negateAsync(asyncFn) {
  return async function (...args) {
    return !(await asyncFn(...args));
  };
}
