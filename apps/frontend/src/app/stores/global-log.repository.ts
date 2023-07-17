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


@Injectable()
export class GlobalLogsRepository {

  store = createStore(
    { name: 'global-log' },
    withEntities<LogEntryWithSource>(),
  );

  logEntries$ = this.store.pipe(selectAllEntities());

  getLogEntry(id: number) {
    return this.store.query(getEntity(id));
  }

  clearLogs() {
    this.store.update(
      deleteAllEntities(),
    );
  }

  clearChannelLogs(id: string) {
    this.store.update(
      deleteEntitiesByPredicate(item => item.source === id),
    );
  }

  addLines(lines: LogEntryWithSource[]) {
    this.store.update(
      addEntities(lines),
    );
  }

}
