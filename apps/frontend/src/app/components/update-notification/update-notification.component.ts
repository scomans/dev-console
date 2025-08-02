import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'dc-update-notification',
  templateUrl: './update-notification.component.html',
  styleUrl: './update-notification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NzButtonModule,
  ],
})
export class UpdateNotificationComponent implements OnInit {

  @ViewChild('template', { static: true }) template: TemplateRef<any>;

  constructor(
    private readonly nzNotificationService: NzNotificationService,
  ) {
  }

  ngOnInit() {
    if (environment.production) {
      void this.checkForUpdate();
    }
  }

  async checkForUpdate() {
    const update = await checkUpdate();
    if (update.shouldUpdate) {
      console.log(`Installing update ${ update.manifest?.version }, ${ update.manifest?.date }, ${ update.manifest.body }`);
      this.nzNotificationService.template(this.template, {
        nzDuration: 0,
        nzPlacement: 'bottomRight',
        nzData: {
          update,
        },
      });
    }
  }

  async installUpdate() {
    await installUpdate();
  }
}
