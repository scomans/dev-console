import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { uuidV4 } from '@dev-console/helpers';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { Channel } from '../../stores/channel/channel.model';
import { ChannelQuery } from '../../stores/channel/channel.query';
import { ChannelService } from '../../stores/channel/channel.service';
import { UiQuery } from '../../stores/ui/ui.query';
import { ChannelEditModalComponent } from '../channel-edit-modal/channel-edit-modal.component';

@Component({
  selector: 'dc-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss'],
})
export class LogComponent implements OnInit {

  subs = new SubSink();

  channels$: Observable<Channel[]>;
  channel$: Observable<Channel>;
  sidebarCollapsed$ = this.uiQuery.select('sidebarCollapsed').pipe(delay(0));

  constructor(
    private readonly channelQuery: ChannelQuery,
    private readonly uiQuery: UiQuery,
    private readonly channelService: ChannelService,
    private readonly modal: NzModalService,
    private readonly viewContainerRef: ViewContainerRef,
  ) {
  }

  ngOnInit() {
    this.channels$ = this.channelQuery.selectAll();
    this.channel$ = this.channelQuery.selectActive();
  }

  openChannel(id: string) {
    this.channelService.setActive(id);
  }

  deleteChannel(channel: Channel) {
    this.channelService.remove(channel.id);
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
        this.channelService.update(channel.id, result);
      }
    });
  }

  newChannel() {
    const modal = this.modal.create({
      nzTitle: 'New channel',
      nzContent: ChannelEditModalComponent,
      nzViewContainerRef: this.viewContainerRef,
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
        this.channelService.add({
          id: uuidV4(),
          ...result,
        });
      }
    });
  }
}
