import { Injectable } from '@angular/core';
import { LogEntryWithSource } from '@dev-console/types';
import { createStore, emitOnce } from '@ngneat/elf';
import { addEntities, deleteAllEntities, deleteEntities, getEntitiesCount, getEntitiesIds, selectAllEntities, withEntities } from '@ngneat/elf-entities';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { filterNil } from '@dev-console/helpers';


@Injectable()
export class ChannelLogRepository {

  channelLogStores = new BehaviorSubject<Record<string, ReturnType<ChannelLogRepository['createStore']>>>({});

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

  selectLogsByChannelId(id: string): Observable<LogEntryWithSource[]> {
    return this.channelLogStores.pipe(
      map(stores => {
        if (stores[id]) {
          return stores[id];
        } else {
          this.createStore(id);
          return null;
        }
      }),
      filterNil(),
      switchMap(store => store),
      selectAllEntities(),
    );
  }

  addLine(line: LogEntryWithSource) {
    let channelStore = this.channelLogStores.getValue()[line.source];
    if (!channelStore) {
      channelStore = this.createStore(line.source);
    }
    emitOnce(() => {
      channelStore.update(addEntities(line));
      const lineCount = channelStore.query(getEntitiesCount());
      if (lineCount > 1000) {
        const entityIds = channelStore.query(getEntitiesIds());
        const idsToDelete = entityIds.slice(0, entityIds.length - 1000);
        channelStore.update(deleteEntities(idsToDelete));
      }
    });
  }
}
