import { Injectable } from '@angular/core';
import { LogEntryWithSource } from '@dev-console/types';
import { createStore } from '@ngneat/elf';
import {
  addEntities,
  deleteAllEntities,
  deleteEntitiesByPredicate,
  getEntity,
  selectAllEntities,
  withEntities,
} from '@ngneat/elf-entities';


const store = createStore(
  { name: 'global-log' },
  withEntities<LogEntryWithSource>(),
);


@Injectable()
export class GlobalLogsRepository {

  logEntries$ = store.pipe(selectAllEntities());

  getLogEntry(id: number) {
    return store.query(getEntity(id));
  }

  clearLogs() {
    store.update(
      deleteAllEntities(),
    );
  }

  clearChannelLogs(id: string) {
    store.update(
      deleteEntitiesByPredicate(item => item.source === id),
    );
  }

  addLines(lines: LogEntryWithSource[]) {
    store.update(
      addEntities(lines),
    );
  }

}
