import { Component, HostListener } from '@angular/core';
import { ElectronService } from '../../services/electron.service';
import { UiQuery } from '../../stores/ui/ui.query';
import { UiService } from '../../stores/ui/ui.service';

@Component({
  selector: 'dc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  maximized$ = this.electronService.maximized$;
  minimized$ = this.electronService.minimized$;
  sidebarCollapsed = this.uiQuery.select('sidebarCollapsed');

  constructor(
    private readonly electronService: ElectronService,
    private readonly uiService: UiService,
    private readonly uiQuery: UiQuery,
  ) {
    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
    } else {
      console.log('Run in browser');
    }
  }

  minimize() {
    void this.electronService.minimize();
  }

  maximize() {
    void this.electronService.maximize();
  }

  restore() {
    void this.electronService.restore();
  }

  close() {
    void this.electronService.quit();
  }

  @HostListener('document:keydown.control.alt.shift.i')
  openDevtools() {
    this.electronService.emit('open-devtools');
  }

  toggleSidebar() {
    this.uiService.toggleSidebar();
  }
}
