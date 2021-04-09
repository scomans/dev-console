import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { filterNil } from '@dev-console/helpers';
import { Channel, ExecuteStatus } from '@dev-console/types';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { trackById } from '../../helpers/angular.helper';
import { ExecuteService } from '../../services/execute.service';
import { LogEntry, LogStoreService } from '../../services/log-store.service';
import { ProjectStoreService } from '../../stores/project-store.service';
import { ChannelEditModalComponent } from '../channel-edit-modal/channel-edit-modal.component';

@Component({
  selector: 'dc-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss'],
})
export class LogComponent implements OnInit {

  ExecuteStatus = ExecuteStatus;
  trackById = trackById;
  subs = new SubSink();

  status$: Observable<ExecuteStatus>;
  channel$: Observable<Channel>;
  log$: Observable<LogEntry[]>;

  constructor(
    private readonly projectStore: ProjectStoreService,
    private readonly modal: NzModalService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly logStoreService: LogStoreService,
    private readonly executeService: ExecuteService,
  ) {
  }

  ngOnInit() {
    this.channel$ = this.projectStore.channel.query.selectActive();
    this.log$ = this.projectStore.channel.query
      .selectActiveId()
      .pipe(
        filterNil(),
        switchMap(id => this.logStoreService.getStore(id)),
      );
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
    void this.executeService.run(channel);
  }

  async restart(channel: Channel) {
    await this.executeService.kill(channel.id);
    await this.executeService.run(channel);
  }

  stop(channel: Channel) {
    void this.executeService.kill(channel.id);
  }
}
