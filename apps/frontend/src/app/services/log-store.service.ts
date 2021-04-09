import { Injectable } from '@angular/core';
import { EntityActions } from '@datorama/akita';
import * as SortedArray from 'collections/sorted-array';
import { BehaviorSubject, Observable, ReplaySubject, Subscription } from 'rxjs';
import { filter, first, multicast, refCount, scan, skipUntil, startWith, switchMap, tap } from 'rxjs/operators';
import { ProjectStoreService } from '../stores/project-store.service';
import { ExecuteService } from './execute.service';

export interface LogEntry {
  id: number;
  data: string;
  type: 'data' | 'error';
  timestamp: number;
}

export interface LogEntryWithSource extends LogEntry {
  source: string;
}

@Injectable({
  providedIn: 'root',
})
export class LogStoreService {

  stores = new Map<string, Observable<LogEntry[]>>();
  storeSubs = new Map<string, Subscription>();
  allStore = new SortedArray<LogEntryWithSource>([], (a, b) => a.timestamp === b.timestamp, (a, b) => a.timestamp - b.timestamp);
  allStoreSubject = new BehaviorSubject<LogEntryWithSource[]>([]);

  constructor(
    private readonly executeService: ExecuteService,
    private readonly globalStoreService: ProjectStoreService,
  ) {
  }

  init() {
    this.globalStoreService.channel.query.selectAll().pipe(
      skipUntil(this.globalStoreService.channel.query.selectLoading().pipe(filter((v) => !v))),
      first(),
      tap(channels => {
        for (const channel of channels) {
          this.registerStore(channel.id);
        }
      }),
      switchMap(() => this.globalStoreService.channel.query.selectEntityAction()),
    ).subscribe(value => {
      console.log(value);
      switch (value.type) {
        case EntityActions.Add:
          for (const id of value.ids) {
            this.registerStore(id);
          }
          break;
        case EntityActions.Remove:
          for (const id of value.ids) {
            this.unregisterStore(id);
          }
          break;
      }
    });
  }

  registerStore(id: string) {
    if (!this.stores.has(id)) {
      this.stores.set(
        id,
        this.executeService.dataOfId(id).pipe(
          tap(data => {
            this.allStore.add({ ...data, source: id });
            this.allStoreSubject.next(this.allStore.toArray());
          }),
          scan((acc, value) => {
            acc.push(value);
            return acc;
          }, []),
          multicast(new ReplaySubject(1)),
          refCount(),
          startWith([]),
        ),
      );
      this.storeSubs.set(id, this.stores.get(id).subscribe());
    }
    return this.stores.get(id);
  }

  unregisterStore(id: string) {
    if (this.stores.has(id)) {
      this.stores.delete(id);
      this.storeSubs.get(id).unsubscribe();
      this.storeSubs.delete(id);
      return true;
    }
    return false;
  }

  getStore(id: string) {
    return this.stores.get(id);
  }
}
