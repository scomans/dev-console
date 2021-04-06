import { Injectable, NgZone } from '@angular/core';
import { BrowserWindow } from '@electron/remote';
import { Dialog, ipcRenderer, webFrame } from 'electron';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {

  private readonly minimized = new BehaviorSubject(false);
  public readonly minimized$ = this.minimized.asObservable();
  private readonly maximized = new BehaviorSubject(false);
  public readonly maximized$ = this.maximized.asObservable();

  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  browserWindow: typeof BrowserWindow;
  readonly dialog: Dialog;

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  get isMinimized() {
    return this.isElectron && this.firstWindow?.isMinimized();
  }

  get isMaximized() {
    return this.isElectron && this.firstWindow?.isMaximized();
  }

  private get firstWindow() {
    if (this.isElectron) {
      return this.browserWindow.getFocusedWindow() ?? this.browserWindow.getAllWindows()[0] ?? null;
    } else {
      return null;
    }
  }

  constructor(
    private _ngZone: NgZone,
  ) {
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.browserWindow = window.require('@electron/remote').BrowserWindow;
      this.dialog = window.require('@electron/remote').dialog;

      this.minimized.next(this.isMinimized);
      this.maximized.next(this.isMaximized);

      this.firstWindow?.on('maximize', () => {
        this.maximized.next(true);
      });

      this.firstWindow?.on('unmaximize', () => {
        this.maximized.next(false);
      });

      this.firstWindow?.on('minimize', () => {
        this.minimized.next(true);
      });

      this.firstWindow?.on('restore', () => {
        this.minimized.next(false);
      });
    }
  }

  async emit<T>(event: string, ...data: any[]): Promise<T> {
    return this.isElectron ? this.toZoneAwarePromise(this.ipcRenderer.invoke(event, data)) : null;
  }

  on<T extends any[]>(event: string) {
    if (this.isElectron) {
      return new Observable<T>(subscriber => {
        const listener = (e, ...args: T): void => {
          this._ngZone.run(() => subscriber.next(args));
        };
        this.ipcRenderer.on(event, listener);
        return () => {
          this.ipcRenderer.removeListener(event, listener);
        };
      });
    }
    return EMPTY;
  }

  async getAppVersion(): Promise<string> {
    return this.isElectron ? this.toZoneAwarePromise(this.ipcRenderer.invoke('get-app-version')) : 'WEB';
  }

  quit(): void {
    return window.close();
  }

  minimize(): void {
    return this.isElectron && this.firstWindow.minimize();
  }

  maximize(): void {
    return this.isElectron && this.firstWindow.maximize();
  }

  restore(): void {
    return this.isElectron && this.firstWindow.restore();
  }

  private toZoneAwarePromise<T>(promise: Promise<T>): Promise<T> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        resolve(await promise);
      } catch (err) {
        reject(err);
      }
    });
  }
}
