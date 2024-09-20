import { Injectable } from '@angular/core';
import { LogEntryWithSource } from '@dev-console/types';
import { createStore, emitOnce } from '@ngneat/elf';
import { addEntities, deleteAllEntities, deleteEntities, deleteEntitiesByPredicate, getEntitiesCount, getEntitiesIds, getEntity, selectAllEntities, withEntities } from '@ngneat/elf-entities';


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
    emitOnce(() => {
      this.store.update(addEntities(lines));
      const lineCount = this.store.query(getEntitiesCount());
      if (lineCount > 1000) {
        const entityIds = this.store.query(getEntitiesIds());
        const idsToDelete = entityIds.slice(0, entityIds.length - 1000);
        this.store.update(deleteEntities(idsToDelete));
      }
    });
  }
}
