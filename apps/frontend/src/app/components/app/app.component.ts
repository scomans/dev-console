import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { openDevtools } from '../../helpers/tauri.helper';
import { environment } from '../../../environments/environment';
import { RouterOutlet } from '@angular/router';
import { UpdateNotificationComponent } from '../update-notification/update-notification.component';


@Component({
  selector: 'dc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RouterOutlet,
    UpdateNotificationComponent,
  ],
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
