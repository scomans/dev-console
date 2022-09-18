import { Injectable } from '@angular/core';
import { LogEntryWithSource } from '@dev-console/types';
import { createStore } from '@ngneat/elf';
import { addEntities, deleteAllEntities, deleteEntitiesByPredicate, getEntity, selectAllEntities, withEntities } from '@ngneat/elf-entities';
import { tap } from 'rxjs/operators';
import { ElectronService } from '../services/electron.service';


const store = createStore(
  { name: 'global-log' },
  withEntities<LogEntryWithSource>(),
);


@Injectable()
export class GlobalLogsRepository {

  logEntries$ = store.pipe(selectAllEntities());

  constructor(
    private readonly electronService: ElectronService,
  ) {
  }

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

  checkForUpdates() {
    return this.electronService.on<[LogEntryWithSource[]]>('log-new-lines')
      .pipe(
        tap(([lines]) => {
          store.update(
            addEntities(lines),
          );
        }),
      );
  }

}
