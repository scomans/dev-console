import { app, ipcMain } from 'electron';
import { environment } from '../../environments/environment';


export default class ElectronEvents {
  static bootstrapElectronEvents(): Electron.IpcMain {
    return ipcMain;
  }
}

// Retrieve app version
ipcMain.handle('get-app-version', (event) => {
  console.log(`Fetching application version... [v${ environment.version }]`);

  return environment.version;
});

// Handle App termination
ipcMain.on('quit', (event, code) => {
  app.exit(code);
});
