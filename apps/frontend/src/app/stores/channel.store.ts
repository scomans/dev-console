import { computed } from '@angular/core';
import { Channel } from '@dev-console/types';
import { isNil, omit } from 'es-toolkit';
import { readJsonFile, writeJsonFile } from '../helpers/tauri.helper';
import { JsonValue } from 'type-fest';
import { exists } from '@tauri-apps/api/fs';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setAllEntities,
  updateEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';


const PROJECT_FILE_VERSION = 1;

export interface ChannelState {
  activeId: string | null;
  loaded: boolean;
}

const initialState: ChannelState = {
  activeId: null,
  loaded: false,
};

export const ChannelStore = signalStore(
  withState(initialState),
  withEntities<Channel>(),
  withComputed(({ activeId, entityMap }) => ({
    activeChannel: computed(() => activeId() ? entityMap()[activeId()] : null),
  })),
  withMethods((store) => ({
    addChannel(channel: Channel): void {
      patchState(store, addEntity(channel));
    },
    updateChannel(id: string, channel: Partial<Channel>): void {
      patchState(store, updateEntity({ id, changes: channel }));
    },
    updateChannels(channels: (Partial<Channel> & { id: string })[]): void {
      for (const channel of channels) {
        patchState(store, updateEntity({ id: channel.id, changes: omit(channel, ['id']) }));
      }
    },
    removeChannel(id: string): void {
      const channel = store.entityMap()[id];
      if (channel) {
        patchState(store, removeEntity(id));
        patchState(
          store,
          updateEntities({
            predicate: ({ index }) => index > channel.index,
            changes: (channel) => ({ index: channel.index - 1 }),
          }),
        );
      }
    },
    setChannelActive(activeId: string | null): void {
      patchState(store, () => ({ activeId }));
    },
    async loadChannels(file: string) {
      if (await exists(file) === false) {
        patchState(store, setAllEntities([]));
        return;
      }
      const projectContent = await readJsonFile(file);
      let channels: Channel[];
      if (!isNil(projectContent['storage'])) {
        // legacy support
        channels = Object.values(projectContent['storage']['channel']['entities']);
      } else {
        channels = projectContent['channels'];
      }
      patchState(store, setAllEntities(channels));
      patchState(store, { loaded: true });
    },
    async persistChannels(file: string): Promise<void> {
      const channels = [...store.entities()]
        .sort((a, b) => a.index - b.index)
        .map((channel, i) => ({
          ...channel,
          index: i,
        }));
      await writeJsonFile(file, { version: PROJECT_FILE_VERSION, channels } as unknown as JsonValue);
    },
  })),
);
