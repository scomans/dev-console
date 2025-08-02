import { computed } from '@angular/core';
import { LogEntryWithSource } from '@dev-console/types';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntity, removeEntities, setAllEntities, withEntities } from '@ngrx/signals/entities';


export interface LogState {
  activeId: string | null;
}

const initialState: LogState = {
  activeId: null,
};

export const LogStore = signalStore(
  { providedIn: 'root', protectedState: false },
  withState(initialState),
  withEntities<LogEntryWithSource>(),
  withComputed(({ activeId, entities }) => ({
    activeChannelLogs: computed(() => {
        const channelId = activeId();
        return channelId
          ? entities().filter((entry) => entry.source === channelId)
          : entities();
      },
    ),
  })),
  withMethods((store) => ({
    addLogEntry(log: LogEntryWithSource): void {
      patchState(store, addEntity(log));
    },
    setActiveChannel(activeId: string | null): void {
      patchState(store, () => ({ activeId }));
    },
    clearChannelLogs(channelId: string): void {
      patchState(store, removeEntities((entry) => entry.source === channelId));
    },
    clearLogs(): void {
      patchState(store, setAllEntities([]));
    },
  })),
);
