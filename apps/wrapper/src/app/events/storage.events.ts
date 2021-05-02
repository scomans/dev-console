import { app, ipcMain, WebContents } from 'electron';
import * as Store from 'electron-store';
import { EventEmitter } from 'events';
import { uniq } from 'lodash';
import { join } from 'path';
import { StoreSchema } from '../types/store';

app.setPath('userData', join(app.getPath('appData'), 'DevConsole'));

export const store = new Store<StoreSchema>({
  serialize: value => JSON.stringify(value, undefined, 2),
});

const updateWatchers: { [key: string]: { watchers: WebContents[], unsub: () => void } } = {};
const syncedKeys: { from: string, to: string, unsub: () => EventEmitter }[] = [];

export default class StorageEvents {
  static bootstrapStorageEvents(): Electron.IpcMain {
    return ipcMain;
  }
}

ipcMain.handle('store-get', (event, [key, def]) => {
  return store.get(key, def);
});

ipcMain.handle('store-set', (event, [key, value]) => {
  if (value === undefined) {
    return store.delete(key);
  } else {
    return store.set(key, value);
  }
});

ipcMain.handle('store-delete', (event, [key]) => {
  return store.delete(key);
});

ipcMain.handle('store-sync', (event, [from, to]) => {
  syncedKeys.push({
    from,
    to,
    unsub: store.onDidChange(from, (newVal, oldVal) => {
      store.set(to, newVal);
    }),
  });
});

ipcMain.handle('store-unsync', (event, [from, to]) => {
  const index = syncedKeys.findIndex(key => key.from === from && key.to === to);
  if (index !== -1) {
    syncedKeys[index].unsub();
    syncedKeys.splice(index, 1);
  }
});

ipcMain.handle('store-register-watcher', (event, [key]) => {
  if (!updateWatchers[key]) {
    const watchers = [event.sender];
    updateWatchers[key] = {
      watchers,
      unsub: store.onDidChange(key, (newVal, oldVal) => {
        uniq(watchers).forEach((sender) => {
          sender.send('store-value-changed', key, newVal, oldVal);
        });
      }),
    };
  } else {
    updateWatchers[key].watchers.push(event.sender);
  }
});

ipcMain.handle('store-unregister-watcher', (event, [key]) => {
  if (updateWatchers[key]) {
    const index = updateWatchers[key].watchers.indexOf(event.sender);
    if (index) {
      updateWatchers[key].watchers.splice(index, 1);
    }
    if (updateWatchers[key].watchers.length === 0) {
      updateWatchers[key].unsub();
    }
  }
});
