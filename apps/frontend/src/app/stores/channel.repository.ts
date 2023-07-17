import { Injectable } from '@angular/core';
import { Channel } from '@dev-console/types';
import { createStore } from '@ngneat/elf';
import { addEntities, deleteEntities, getAllEntities, getEntity, selectActiveEntity, selectActiveId, selectAllEntities, setActiveId, setEntities, updateEntities, withActiveId, withEntities } from '@ngneat/elf-entities';
import { isNil, omit, sortBy } from 'lodash';
import { Observable, skip, switchMap } from 'rxjs';
import { readJsonFile, writeJsonFile } from '../helpers/tauri.helper';
import { JsonValue } from 'type-fest';
import { debug, filterNil } from '@dev-console/helpers';
import { map } from 'rxjs/operators';


@Injectable()
export class ChannelRepository {

  private store = createStore(
    { name: 'channels' },
    withEntities<Channel>(),
    withActiveId(),
  );

  channels$ = this.store.pipe(selectAllEntities());
  activeChannel$ = this.store.pipe(selectActiveEntity());
  activeChannelId$: Observable<string> = this.store.pipe(selectActiveId());

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

  public async loadChannels(file: string) {
    const projectContent = await readJsonFile(file);
    let channels: Channel[];
    if (!isNil(projectContent['storage'])) {
      // legacy support
      channels = Object
        .values(projectContent['storage']['channel']['entities'])
        .map((channel: Channel) => omit(channel, 'stopSignal'));
    } else {
      channels = projectContent['channels'];
    }
    this.store.update(setEntities(channels));
  }

  public persistChannels(file: string): Observable<void> {
    return this.store.pipe(
      selectAllEntities(),
      skip(1),
      filterNil(),
      map(channels => sortBy(channels, 'index')),
      debug('persistChannels: ' + file),
      switchMap(channels => writeJsonFile(file, { channels } as unknown as JsonValue)),
    );
  }
}
