import { app, ipcMain, WebContents } from 'electron';
import * as Store from 'electron-store';
import { EventEmitter } from 'events';
import { uniq } from 'lodash';
import { basename, dirname, join } from 'path';
import { StoreSchema } from '../types/store';

app.setPath('userData', join(app.getPath('appData'), 'DevConsole'));

let store = new Store<StoreSchema>();

const updateWatchers: { [key: string]: { watchers: WebContents[], unsub: () => void } } = {};
const syncedKeys: { from: string, to: string, unsub: () => EventEmitter }[] = [];

export default class ProjectStorageEvents {
  static bootstrapStorageEvents(): Electron.IpcMain {
    return ipcMain;
  }
}

ipcMain.handle('project-store-open', (event, [path]) => {
  const cwd = dirname(path);
  const name = basename(path).replace('.json', '');
  store = new Store<StoreSchema>({
    name,
    cwd,
  });
  return true;
});

ipcMain.handle('project-store-close', () => {
  store = null;
  return true;
});

ipcMain.handle('project-store-get', (event, [key, def]) => {
  return store.get(key, def);
});

ipcMain.handle('project-store-set', (event, [key, value]) => {
  if (value === undefined) {
    return store.delete(key);
  } else {
    return store.set(key, value);
  }
});

ipcMain.handle('project-store-delete', (event, [key]) => {
  return store.delete(key);
});

ipcMain.handle('project-store-sync', (event, [from, to]) => {
  syncedKeys.push({
    from,
    to,
    unsub: store.onDidChange(from, (newVal) => {
      store.set(to, newVal);
    }),
  });
});

ipcMain.handle('project-store-unsync', (event, [from, to]) => {
  const index = syncedKeys.findIndex(key => key.from === from && key.to === to);
  if (index !== -1) {
    syncedKeys[index].unsub();
    syncedKeys.splice(index, 1);
  }
});

ipcMain.handle('project-store-register-watcher', (event, [key]) => {
  if (!updateWatchers[key]) {
    const watchers = [event.sender];
    updateWatchers[key] = {
      watchers,
      unsub: store.onDidChange(key, (newVal, oldVal) => {
        uniq(watchers).forEach((sender) => {
          sender.send('project-store-value-changed', key, newVal, oldVal);
        });
      }),
    };
  } else {
    updateWatchers[key].watchers.push(event.sender);
  }
});

ipcMain.handle('project-store-unregister-watcher', (event, [key]) => {
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
