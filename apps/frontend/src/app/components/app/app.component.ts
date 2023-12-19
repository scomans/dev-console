import { ChangeDetectionStrategy, Component, HostListener, isDevMode } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateNotificationComponent } from '../update-notification/update-notification.component';
import { openDevtools } from '../../types/tauri';


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
    if (isDevMode()) {
      void openDevtools();
    }
  }
}
