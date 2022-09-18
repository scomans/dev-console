import { Component, HostListener } from '@angular/core';
import { ElectronService } from '../../services/electron.service';


@Component({
  selector: 'dc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  constructor(
    private readonly electronService: ElectronService,
  ) {
    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
    } else {
      console.log('Run in browser');
    }
  }

  @HostListener('document:keydown.control.alt.shift.i')
  openDevtools() {
    void this.electronService.emit('open-devtools');
  }
}
