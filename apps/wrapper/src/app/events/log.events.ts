import { LogEntry, LogEntryWithSource } from '@dev-console/types';
import * as SortedArray from 'collections/sorted-array';
import { ipcMain } from 'electron';

let mainWindow: Electron.BrowserWindow = null;

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

ipcMain.handle('log-clear', () => {
  allLogStores.clear();
  logStores.clear();
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
  logStores.get(id).push(newLine);
  allLogStores.add(newLine);

  if (mainWindow) {
    mainWindow.webContents.send('log-new-line', newLine);
  }
}
