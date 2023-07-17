import { fetch } from '@tauri-apps/api/http';
import { concat, Observable, of, retry, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Command } from '@tauri-apps/api/shell';
import { isNil } from 'lodash';


export function waitFor(conditions: string[]) {
  const conditionWaiters: Observable<void>[] = [];

  for (const condition of conditions) {
    if (condition.startsWith('http:') || condition.startsWith('https:')) {
      conditionWaiters.push(waitForHttp(condition));
    } else if (condition.startsWith('http-get:') || condition.startsWith('https-get:')) {
      conditionWaiters.push(waitForHttpGet(condition));
    } else if (condition.startsWith('tcp:')) {
      conditionWaiters.push(waitForTcp(condition));
    }
  }

  return concat(...conditionWaiters);
}

function waitForHttp(url: string) {
  return of(1).pipe(
    switchMap(() => fetch(url, { method: 'HEAD', timeout: 1 })),
    map(response => {
      if (!response.ok) {
        throw new Error(`HTTP request failed with status code ${ response.status }`);
      }
    }),
    retry({ delay: 1000 }),
  );
}

function waitForHttpGet(url: string) {
  url = url
    .replace('http-get:', 'http:')
    .replace('https-get:', 'https:');
  return of(1).pipe(
    switchMap(() => fetch(url, { method: 'GET', timeout: 1 })),
    map(response => {
      if (!response.ok) {
        throw new Error(`HTTP request failed with status code ${ response.status }`);
      }
    }),
    retry({ delay: 1000 }),
  );
}

function waitForTcp(url: string) {
  url = url.replace('tcp:', '');
  let [host, port] = url.split(':');
  if (isNil(port)) {
    port = host;
    host = 'localhost';
  }
  return of(1).pipe(
    switchMap(() => Command.sidecar('sidecars/port-qry', ['-n', host, '-p', 'tcp', '-e', port, '-q']).execute()),
    map(response => {
      if (response.code !== 0) {
        throw new Error(`Port not listening`);
      }
    }),
    retry({ delay: 1000 }),
  );
}
