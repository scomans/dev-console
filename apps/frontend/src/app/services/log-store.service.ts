import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subscription } from 'rxjs';
import { multicast, refCount, scan, startWith } from 'rxjs/operators';
import { ExecuteService } from './execute.service';

export interface LogEntry {
  data: string;
  type: 'data' | 'error';
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class LogStoreService {

  stores = new Map<string, Observable<LogEntry[]>>();
  storeSubs = new Map<string, Subscription>();

  constructor(
    private readonly executeService: ExecuteService,
  ) {
  }

  getStore(id: string) {
    if (!this.stores.has(id)) {
      this.stores.set(
        id,
        this.executeService.dataOfId(id).pipe(
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
}
