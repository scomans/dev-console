import { exec } from 'child_process';
import { dialog, ipcMain, OpenDialogOptions, shell } from 'electron';
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

ipcMain.handle('open-external', async (event, [url]) => {
  return shell.openExternal(url);
});

ipcMain.handle('update-window-status', (event, [func]: ['hide' | 'minimize' | 'maximize' | 'restore']) => {
  switch (func) {
    case 'hide':
      App.mainWindow.hide();
      break;
    case 'minimize':
      App.mainWindow.minimize();
      break;
    case 'maximize':
      App.mainWindow.maximize();
      break;
    case 'restore':
      App.mainWindow.restore();
      break;
  }
});

ipcMain.handle('get-window-status', () => {
  return {
    minimized: App.mainWindow.isMinimized(),
    maximized: App.mainWindow.isMaximized(),
  };
});

ipcMain.handle('show-open-dialog', (event, options: OpenDialogOptions) => {
  return dialog.showOpenDialog(options);
});
