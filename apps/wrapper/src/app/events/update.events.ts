import { ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { isDevelopmentMode } from '../helpers/electron.helper';


export default class UpdateEvents {

  static checkForUpdates() {
    console.log('Initializing auto update service...');
    if (!isDevelopmentMode()) {
      return autoUpdater.checkForUpdates();
    }
  }
}

ipcMain.handle('check-for-updates', async () => {
  if (!isDevelopmentMode()) {
    const result = await autoUpdater.checkForUpdates();
    if (result) {
      console.log(result.updateInfo);
      return result.downloadPromise;
    }
  }
});

ipcMain.handle('restart-for-update', async () => {
  autoUpdater.quitAndInstall(false);
});

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', () => {
  console.log('New update available!');
});

autoUpdater.on('update-not-available', () => {
  console.log('Up to date!');
});

autoUpdater.on('error', message => {
  console.error('There was a problem updating the application');
  console.error(message);
});
