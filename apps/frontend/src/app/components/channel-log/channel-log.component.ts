import { Component, ElementRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { filterNil } from '@dev-console/helpers';
import { Channel, ExecuteStatus } from '@dev-console/types';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { trackById } from '../../helpers/angular.helper';
import { ExecuteService } from '../../services/execute.service';
import { ProjectStoreService } from '../../stores/project-store.service';
import { ChannelEditModalComponent } from '../channel-edit-modal/channel-edit-modal.component';
import { LogMinimapComponent } from '../log-minimap/log-minimap.component';

@Component({
  selector: 'dc-channel-log',
  templateUrl: './channel-log.component.html',
  styleUrls: ['./channel-log.component.scss'],
})
export class ChannelLogComponent implements OnInit {

  ExecuteStatus = ExecuteStatus;
  trackById = trackById;
  subs = new SubSink();

  status$: Observable<ExecuteStatus>;
  channel$: Observable<Channel>;

  @ViewChild(LogMinimapComponent, { read: ElementRef }) minimapElement: ElementRef<HTMLElement>;

  constructor(
    private readonly projectStore: ProjectStoreService,
    private readonly modal: NzModalService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly executeService: ExecuteService,
  ) {
  }

  ngOnInit() {
    this.channel$ = this.projectStore.channel.query.selectActive();
    this.status$ = this.projectStore.channel.query
      .selectActiveId()
      .pipe(
        filterNil(),
        switchMap(id => this.executeService.selectStatus(id)),
      );
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
    await this.executeService.kill(channel.id);
    await this.executeService.run(channel, this.projectStore.currentProject.file);
  }

  stop(channel: Channel) {
    void this.executeService.kill(channel.id);
  }

  makeColor(channel: Channel) {
    return {
      [channel.id]: channel.color,
    };
  }
}
