import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { WebviewTag } from 'electron';
import { SubSink } from 'subsink';
import { ElectronService } from '../services/electron.service';


@Directive({
  selector: 'webview',
})
export class WebviewDirective implements OnInit, OnDestroy {

  tunnelSubs = new SubSink();

  _link: string;
  @Input()
  set link(value: string) {
    this._link = value;
    void this.loadLink(value);
  }

  @Input()
  set data(value: any) {
    void this.sendData(value);
  }

  @Input()
  set tunnels(events: string[]) {
    void this.tunnelEvents(events);
  }

  @Input()
  set devTools(value: boolean) {
    this.webview.then((webview) => value ? webview.openDevTools() : webview.closeDevTools());
  }

  webview: Promise<WebviewTag>;
  webviewReady: Promise<void>;

  constructor(
    private readonly el: ElementRef<WebviewTag>,
    private readonly electronService: ElectronService,
  ) {
    const webview = this.el.nativeElement;

    webview.nodeintegration = true;
    webview.enableremotemodule = true;
    webview.webpreferences = 'contextIsolation=false';

    this.webviewReady = new Promise(resolveReady => {
      this.webview = new Promise(resolve => {
        webview.addEventListener('dom-ready', () => {
          resolve(webview);
        });
        webview.addEventListener('ipc-message', event => {
          if (event.channel === 'webview-ready') {
            resolveReady();
          }
        });
      });
    });
  }

  ngOnInit() {
    const webview = this.el.nativeElement;
    webview.src = document.location.origin + document.location.pathname + '#' + this._link;
  }

  ngOnDestroy() {
    this.tunnelSubs.unsubscribe();
  }

  async tunnelEvents(events: string[]) {
    const webview = await this.webview;

    this.tunnelSubs.unsubscribe();
    this.tunnelSubs = new SubSink();
    for (const event of events) {
      this.tunnelSubs.sink = this.electronService.on(event).subscribe(value => webview.send(event, ...value));
    }
  }

  async loadLink(link: string) {
    const url = document.location.origin + document.location.pathname + '#' + link;
    const webview = await this.webview;
    if (webview.getURL() !== url) {
      await webview.loadURL(url);
    }
  }

  async sendData(data: any): Promise<void> {
    await this.webviewReady;
    const webview = await this.webview;
    return webview.send('webview-data', data);
  }
}
