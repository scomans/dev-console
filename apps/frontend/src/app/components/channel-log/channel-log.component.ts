import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { filterNil } from '@dev-console/helpers';
import { Channel, ExecuteStatus, LogEntryWithSource } from '@dev-console/types';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { faBroom, faEdit, faPlay, faRedo, faStop, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { sleep } from '../../../../../../libs/helpers/src/lib/promise.helper';
import { trackById } from '../../helpers/angular.helper';
import { ExecuteService } from '../../services/execute.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelRepository } from '../../stores/channel.repository';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { ProjectRepository } from '../../stores/project.repository';


@Component({
  selector: 'dc-channel-log',
  templateUrl: './channel-log.component.html',
  styleUrls: ['./channel-log.component.scss'],
})
export class ChannelLogComponent implements OnInit {

  readonly farQuestionCircle = faQuestionCircle;
  readonly fasTrash = faTrash;
  readonly fasPlay = faPlay;
  readonly fasRedo = faRedo;
  readonly fasStop = faStop;
  readonly fasBroom = faBroom;
  readonly fasEdit = faEdit;

  ExecuteStatus = ExecuteStatus;
  trackById = trackById;
  subs = new SubSink();

  status$: Observable<ExecuteStatus>;
  channel$: Observable<Channel>;
  logs$: Observable<LogEntryWithSource[]>;

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly executeService: ExecuteService,
    private readonly channelRepository: ChannelRepository,
    private readonly channelLogRepository: ChannelLogRepository,
    private readonly globalLogsRepository: GlobalLogsRepository,
  ) {
  }

  ngOnInit() {
    this.channel$ = this.channelRepository.activeChannel$;
    this.status$ = this.channelRepository.activeChannelId$
      .pipe(
        filterNil(),
        switchMap(id => this.executeService.selectStatus(id)),
      );
    this.logs$ = this.channelRepository.activeChannelId$
      .pipe(
        switchMap(id => this.channelLogRepository.selectLogsByChannelId(id)),
      );
  }

  deleteChannel(channel: Channel) {
    this.channelRepository.removeChannel(channel.id);
    this.channelRepository.setChannelActive(null);
  }

  updateChannel(channel?: Omit<Channel, 'index'>) {
    this.channelRepository.updateChannel(channel.id, channel);
  }

  run(channel: Channel) {
    void this.executeService.run(channel, this.projectRepository.getActiveProject().file);
  }

  async restart(channel: Channel) {
    const killed = await this.executeService.kill(channel);
    if (killed) {
      await sleep(1000);
      await this.executeService.run(channel, this.projectRepository.getActiveProject().file);
    }
  }

  stop(channel: Channel) {
    return this.executeService.kill(channel);
  }

  makeColor(channel: Channel) {
    return {
      [channel.id]: channel.color,
    };
  }

  clearChannel(channel: Channel) {
    void this.channelLogRepository.clearChannelLogs(channel.id);
    void this.globalLogsRepository.clearChannelLogs(channel.id);
  }

}
