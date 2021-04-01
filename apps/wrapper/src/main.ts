import * as remoteMain from '@electron/remote/main';
import { app, BrowserWindow, nativeTheme } from 'electron';
import log from 'electron-log';
import { unlinkSync } from 'fs';
import { join } from 'path';
import App from './app/app';
import AppEvents from './app/events/app.events';
import ElectronEvents from './app/events/electron.events';
import ExecuteEvents from './app/events/execute.events';
import StorageEvents from './app/events/storage.events';
import UpdateEvents from './app/events/update.events';
import { mkdirSyncIfNotExists } from './app/helpers/fs.helper';


app.setPath('userData', join(app.getPath('appData'), 'DevConsole'));

nativeTheme.themeSource = 'dark';

mkdirSyncIfNotExists(join(app.getPath('appData'), 'DevConsole', 'logs'));
try {
  unlinkSync(join(app.getPath('appData'), 'DevConsole', 'logs', 'devconsole.log'));
} catch (ignore) {
  // ignore
}
log.transports.file.resolvePath = () => {
  return join(app.getPath('appData'), 'DevConsole', 'logs', 'devconsole.log');
};
Object.assign(console, log.functions);

class Main {

  static initialize() {
    remoteMain.initialize();
  }

  static bootstrapApp() {
    App.main(app, BrowserWindow);
  }

  static bootstrapAppEvents() {
    AppEvents.bootstrapAppEvents();
    ElectronEvents.bootstrapElectronEvents();
    StorageEvents.bootstrapStorageEvents();
    ExecuteEvents.bootstrapExecuteEvents();

    UpdateEvents.checkForUpdates();
  }
}

// handle setup events as quickly as possible
Main.initialize();

// bootstrap app
Main.bootstrapApp();
Main.bootstrapAppEvents();
