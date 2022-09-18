import { Injectable, NgZone } from '@angular/core';
import type { OpenDialogOptions, OpenDialogReturnValue } from 'electron';
import { ipcRenderer, webFrame } from 'electron';
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

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  get isMinimized() {
    return this.minimized.getValue();
  }

  get isMaximized() {
    return this.maximized.getValue();
  }

  constructor(
    private _ngZone: NgZone,
  ) {
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;

      this
        .emit<{ minimized: boolean; maximized: boolean }>('get-window-status')
        .then(({ minimized, maximized }) => {
          this.minimized.next(minimized);
          this.maximized.next(maximized);
        });

      this
        .on<['maximize' | 'unmaximize' | 'minimize' | 'restore']>('window-status')
        .subscribe(([event]) => {
          switch (event) {
            case 'maximize':
              this.maximized.next(true);
              break;
            case 'unmaximize':
              this.maximized.next(false);
              break;
            case 'minimize':
              this.minimized.next(true);
              break;
            case 'restore':
              this.minimized.next(false);
              break;
          }
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

  showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
    return this.emit<OpenDialogReturnValue>('show-open-dialog', options);
  }

  async getAppVersion(): Promise<string> {
    return (await this.emit('get-app-version')) ?? 'WEB';
  }

  quit(): void {
    void this.emit('quit');
  }

  hide(): void {
    if (this.isElectron) {
      void this.emit('update-window-status', 'hide');
    }
  }

  minimize(): void {
    if (this.isElectron) {
      void this.emit('update-window-status', 'minimize');
    }
  }

  maximize(): void {
    if (this.isElectron) {
      void this.emit('update-window-status', 'maximize');
    }
  }

  restore(): void {
    if (this.isElectron) {
      void this.emit('update-window-status', 'restore');
    }
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
