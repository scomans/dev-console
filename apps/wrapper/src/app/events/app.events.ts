import { exec } from 'child_process';
import { ipcMain } from 'electron';
import App from '../app';


export default class AppEvents {
  static bootstrapAppEvents(): Electron.IpcMain {
    return ipcMain;
  }
}

ipcMain.handle('open-folder', async (event, [path]: [string]) => {
  exec(`start "" "${path}"`);
  return true;
});

ipcMain.handle('open-devtools', async () => {
  App.mainWindow.webContents.openDevTools({ mode: 'detach' });
  return true;
});
