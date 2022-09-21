import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { format } from 'url';
import { environment } from '../environments/environment';
import { rendererAppName, rendererAppPort } from './constants';
import ExecuteEvents from './events/execute.events';
import { store } from './events/storage.events';
import { WindowStateKeeper } from './helpers/window-state.helper';


export default class App {
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  static mainWindow: Electron.BrowserWindow;
  static application: Electron.App;
  static BrowserWindow;

  public static isDevelopmentMode() {
    const isEnvironmentSet: boolean = 'ELECTRON_IS_DEV' in process.env;
    const getFromEnvironment: boolean = parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;

    return isEnvironmentSet ? getFromEnvironment : !environment.production;
  }

  private static async onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      await ExecuteEvents.quit();
      app.quit();
    }
  }

  private static onClose() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    App.mainWindow = null;
  }

  private static onRedirect(event: any, url: string) {
    if (url !== App.mainWindow.webContents.getURL()) {
      // this is a normal external redirect, open it in a new browser window
      event.preventDefault();
      void shell.openExternal(url);
    }
  }

  private static async onReady() {

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    App.initMainWindow();
    await App.loadMainWindow();
    ExecuteEvents.setMainWindow(App.mainWindow);

    if (App.isDevelopmentMode()) {
      App.mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  }

  private static onActivate() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (App.mainWindow === null) {
      void App.onReady();
    }
  }

  private static initMainWindow() {
    // Create the browser window.
    App.mainWindow = new BrowserWindow({
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#1d242a',
        symbolColor: '#ffffff',
        height: 64,
      },
      frame: false,
      minWidth: 400,
      minHeight: 350,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        backgroundThrottling: false,
        contextIsolation: false,
      },
      opacity: 0,
    });

    // Apply windows state of previous session
    new WindowStateKeeper(App.mainWindow, {
      save: state => store.set('window-state', state),
      load: () => store.get('window-state'),
      defaultWidth: 1200,
      defaultHeight: 700,
    });

    App.mainWindow.setMenu(null);

    // if main window is ready to show, close the splash window and show the main window
    App.mainWindow.once('ready-to-show', () => {
      App.mainWindow.show();
    });

    // handle all external redirects in a new browser window
    App.mainWindow.webContents.on('will-navigate', App.onRedirect);
    App.mainWindow.webContents.on('new-window', (event, url) => {
      App.onRedirect(event, url);
    });

    // Emitted when the window is closed.
    App.mainWindow.on('closed', App.onClose);
  }

  private static async loadMainWindow() {
    // load the index.html of the app.
    if (!App.application.isPackaged) {
      await App.mainWindow.loadURL(`http://localhost:${ rendererAppPort }`);
    } else {
      await App.mainWindow.loadURL(format({
        pathname: join(__dirname, '..', rendererAppName, 'index.html'),
        protocol: 'file:',
        slashes: true,
      }));

      App.mainWindow.webContents.on('did-fail-load', () => {
        App.mainWindow.loadURL(format({
          pathname: join(__dirname, '..', rendererAppName, 'index.html'),
          protocol: 'file:',
          slashes: true,
        }));
      });
    }
    App.mainWindow.setOpacity(1);
  }

  static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
    // we pass the Electron.App object and the
    // Electron.BrowserWindow into this function
    // so this class has no dependencies. This
    // makes the code easier to write tests for

    App.BrowserWindow = browserWindow;
    App.application = app;

    App.application.on('window-all-closed', App.onWindowAllClosed);     // Quit when all windows are closed.
    App.application.on('ready', App.onReady);                           // App is ready to load data
    App.application.on('activate', App.onActivate);                     // App is activated
  }
}
