import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AsyncPipe } from '@angular/common';
import { getTauriVersion, getVersion } from '@tauri-apps/api/app';
import { arch, type } from '@tauri-apps/api/os';
import { environment } from '../../../environments/environment';
import { LicensesModalComponent } from '../licenses-modal/licenses-modal.component';

@Component({
  selector: 'dc-about-modal',
  templateUrl: './about-modal.component.html',
  styleUrls: ['./about-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    LicensesModalComponent,
    NzButtonModule,
    NzModalModule,
  ],
})
export class AboutModalComponent {

  protected readonly isVisible = signal(false);
  protected readonly version = environment.production ? getVersion() : 'DEV';
  protected readonly tauriVersion = getTauriVersion();
  protected readonly platform = type();
  protected readonly arch = arch();

  close(): void {
    this.isVisible.update(() => false);
  }

  show() {
    this.isVisible.update(() => true);
  }
}
