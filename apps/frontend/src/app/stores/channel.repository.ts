import { Injectable, OnDestroy } from '@angular/core';
import { Channel } from '@dev-console/types';
import { createStore } from '@ngneat/elf';
import { addEntities, deleteEntities, getAllEntities, getEntity, selectActiveEntity, selectActiveId, selectAllEntities, setActiveId, updateEntities, withActiveId, withEntities } from '@ngneat/elf-entities';
import { persistState } from '@ngneat/elf-persist-state';
import { pick } from 'lodash';
import { Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { ProjectStorageService } from '../services/project-storage.service';


@Injectable()
export class ChannelRepository implements OnDestroy {

  private store = createStore(
    { name: 'channel' },
    withEntities<Channel>(),
    withActiveId(),
  );

  private persist = persistState(this.store, {
    key: 'channel',
    storage: {
      getItem: (key) => this.storageService.get('storage.' + key),
      removeItem: (key: string) => this.storageService.delete('storage.' + key),
      setItem: (key, value) => this.storageService.set('storage.' + key, pick(value, 'entities', 'ids')),
    },
  });
  channels$ = this.persist.initialized$.pipe(
    filter(init => init),
    switchMap(() => this.store),
    selectAllEntities(),
  );
  activeChannel$ = this.persist.initialized$.pipe(
    filter(init => init),
    switchMap(() => this.store),
    selectActiveEntity(),
  );
  activeChannelId$: Observable<string> = this.persist.initialized$.pipe(
    filter(init => init),
    switchMap(() => this.store),
    selectActiveId(),
  );

  constructor(
    private readonly storageService: ProjectStorageService,
  ) {
  }

  ngOnDestroy() {
    this.persist?.unsubscribe();
  }

  addChannel(channel: Channel) {
    this.store.update(
      addEntities(channel),
    );
  }

  updateChannel(id: string, channel: Partial<Channel>) {
    this.store.update(
      updateEntities(id, channel),
    );
  }

  removeChannel(id: string) {
    this.store.update(
      deleteEntities(id),
    );
  }

  getChannels() {
    return this.store.query(getAllEntities());
  }

  getChannel(id: string) {
    return this.store.query(getEntity(id));
  }

  setChannelActive(id: string) {
    this.store.update(
      setActiveId(id),
    );
  }
}
