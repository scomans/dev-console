import { Component, HostListener } from '@angular/core';
import { openDevtools } from '../../helpers/tauri.helper';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'dc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  @HostListener('document:keydown.control.alt.shift.i')
  openDevtools() {
    void openDevtools();
  }

  constructor() {
    if (!environment.production) {
      void openDevtools();
    }
  }
}
