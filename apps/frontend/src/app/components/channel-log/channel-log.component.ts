import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { filterNil } from '@dev-console/helpers';
import { Channel, ExecuteStatus } from '@dev-console/types';
import { WebviewTag } from 'electron';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { trackById } from '../../helpers/angular.helper';
import { ElectronService } from '../../services/electron.service';
import { ExecuteService } from '../../services/execute.service';
import { ProjectStoreService } from '../../stores/project-store.service';
import { ChannelEditModalComponent } from '../channel-edit-modal/channel-edit-modal.component';

@Component({
  selector: 'dc-channel-log',
  templateUrl: './channel-log.component.html',
  styleUrls: ['./channel-log.component.scss'],
})
export class ChannelLogComponent implements OnInit, AfterViewInit {

  ExecuteStatus = ExecuteStatus;
  trackById = trackById;
  subs = new SubSink();

  status$: Observable<ExecuteStatus>;
  channel$: Observable<Channel>;

  @ViewChild('webview', { read: ElementRef }) webview: ElementRef<WebviewTag>;

  constructor(
    private readonly projectStore: ProjectStoreService,
    private readonly modal: NzModalService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly executeService: ExecuteService,
    private readonly electronService: ElectronService,
  ) {
  }

  ngOnInit() {
    this.channel$ = this.projectStore.ui.query
      .select('activeChannel')
      .pipe(
        switchMap(activeChannel => this.projectStore.channel.query.selectEntity(activeChannel)),
      );
    this.status$ = this.projectStore.ui.query
      .select('activeChannel')
      .pipe(
        filterNil(),
        switchMap(id => this.executeService.selectStatus(id)),
      );
  }

  ngAfterViewInit() {
    this.webview.nativeElement.addEventListener('new-window', (event) => {
      void this.electronService.emit('open-external', event.url);
    });
  }

  deleteChannel(channel: Channel) {
    this.projectStore.channel.service.remove(channel.id);
  }

  editChannel(channel: Channel) {
    const modal = this.modal.create({
      nzTitle: 'Edit channel',
      nzContent: ChannelEditModalComponent,
      nzViewContainerRef: this.viewContainerRef,
      nzComponentParams: {
        channel,
      },
      nzFooter: [
        {
          label: 'Cancel',
          onClick: () => modal.triggerCancel(),
        },
        {
          label: 'Done',
          type: 'primary',
          onClick: componentInstance => componentInstance!.done(),
        },
      ],
    });

    modal.afterClose.subscribe(result => {
      if (result) {
        this.projectStore.channel.service.update(channel.id, result);
      }
    });
  }

  run(channel: Channel) {
    void this.executeService.run(channel, this.projectStore.currentProject.file);
  }

  async restart(channel: Channel) {
    await this.executeService.kill(channel);
    await this.executeService.run(channel, this.projectStore.currentProject.file);
  }

  stop(channel: Channel) {
    void this.executeService.kill(channel);
  }

  makeColor(channel: Channel) {
    return {
      [channel.id]: channel.color,
    };
  }
}
