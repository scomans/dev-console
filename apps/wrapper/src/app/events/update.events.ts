import { dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import App from '../app';

export default class UpdateEvents {

  static checkForUpdates() {
    console.log('Initializing auto update service...');
    if (!App.isDevelopmentMode()) {
      void autoUpdater.checkForUpdatesAndNotify();
    }
  }
}

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate) => {
  console.log({ releaseNotes, releaseName, releaseDate });
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'DevConsole Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.',
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
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

autoUpdater.on('before-quit-for-update', () => {
  console.log('Application update is about to begin...');
});

autoUpdater.on('error', message => {
  console.error('There was a problem updating the application');
  console.error(message);
});
