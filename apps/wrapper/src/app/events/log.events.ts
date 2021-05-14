import { Channel, LogEntry, LogEntryWithSource } from '@dev-console/types';
import * as SortedArray from 'collections/sorted-array';
import { ipcMain } from 'electron';

let mainWindow: Electron.BrowserWindow = null;

const maxLength = 1000;

const allLogStores = new SortedArray<LogEntryWithSource>([], (a, b) => a.timestamp === b.timestamp, (a, b) => a.timestamp - b.timestamp);
const logStores = new Map<string, LogEntry[]>();

let index = 0;

export default class LogEvents {
  static bootstrapLogEvents(): Electron.IpcMain {
    return ipcMain;
  }

  static setMainWindow(win: Electron.BrowserWindow) {
    mainWindow = win;
  }
}

ipcMain.handle('log-get', (event, [id]: [string]) => {
  return logStores.get(id) ?? [];
});

ipcMain.handle('log-clear', (event, [channel]: [Channel]) => {
  if (!channel) {
    allLogStores.clear();
    logStores.clear();
  } else {
    for (let i = 0; i < allLogStores.length;) {
      const value = allLogStores.toArray()[i];
      if (value.source === channel.id) {
        allLogStores.splice(i, 1);
      } else {
        i++;
      }
    }
    logStores.delete(channel.id);
  }
  mainWindow.webContents.send('log-reset');
});

ipcMain.handle('log-get-all', () => {
  return allLogStores.toArray();
});

ipcMain.handle('log-delete', (event, [id]: [string]) => {
  return logStores.delete(id);
});

export function addLine(id: string, line: LogEntry) {
  const newLine: LogEntryWithSource = {
    ...line,
    id: index++,
    source: id,
  };

  if (!logStores.has(id)) {
    logStores.set(id, []);
  }
  const logStore = logStores.get(id);
  logStore.push(newLine);
  if (logStore.length > maxLength) {
    logStore.shift();
  }

  allLogStores.add(newLine);
  if (allLogStores.length > maxLength) {
    allLogStores.shift();
  }

  if (mainWindow) {
    mainWindow.webContents.send('log-new-line', newLine);
  }
}
