import { Injectable } from '@angular/core';
import { LogEntryWithSource } from '@dev-console/types';
import { createStore } from '@ngneat/elf';
import { addEntities, deleteAllEntities, selectAllEntities, withEntities } from '@ngneat/elf-entities';
import { groupBy } from 'lodash';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ElectronService } from '../services/electron.service';


@Injectable({ providedIn: 'root' })
export class ChannelLogRepository {

  channelLogStores = new BehaviorSubject<Record<string, ReturnType<ChannelLogRepository['createStore']>>>({});

  constructor(
    private readonly electronService: ElectronService,
  ) {
  }

  clearChannelLogs(channelId: string) {
    const channelStore = this.channelLogStores.getValue()[channelId];
    if (channelStore) {
      channelStore.update(
        deleteAllEntities(),
      );
    }
  }

  clearLogs() {
    const channelStores = this.channelLogStores.getValue();
    for (const id of Object.keys(channelStores)) {
      const channelStore = channelStores[id];
      if (channelStore) {
        channelStore.update(
          deleteAllEntities(),
        );
      }
    }
  }

  private createStore(channelId: string) {
    const store = createStore(
      { name: 'channel-' + channelId },
      withEntities<LogEntryWithSource>(),
    );
    let channelStores = this.channelLogStores.getValue();
    channelStores = {
      ...channelStores,
      [channelId]: store,
    };
    this.channelLogStores.next(channelStores);
    return store;
  }

  checkForUpdates() {
    return this.electronService.on<[LogEntryWithSource[]]>('log-new-lines')
      .pipe(
        tap(([lines]) => {
          const groupedLines = groupBy(lines, 'source');
          for (const source of Object.keys(groupedLines)) {
            let channelStore = this.channelLogStores.getValue()[source];
            if (!channelStore) {
              channelStore = this.createStore(source);
            }
            channelStore.update(
              addEntities(groupedLines[source]),
            );
          }
        }),
      );
  }

  selectLogsByChannelId(id: string): Observable<LogEntryWithSource[]> {
    return this.channelLogStores.pipe(
      map(stores => {
        if (stores[id]) {
          return stores[id];
        } else {
          return this.createStore(id);
        }
      }),
      switchMap(store => store),
      selectAllEntities(),
    );
  }
}
