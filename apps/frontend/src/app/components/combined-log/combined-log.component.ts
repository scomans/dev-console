import { Component, ViewContainerRef } from '@angular/core';
import { Channel, ExecuteStatus } from '@dev-console/types';
import { faBroom, faPlay, faRedo, faStop } from '@fortawesome/free-solid-svg-icons';
import { keyBy, mapValues } from 'lodash';
import { NzModalService } from 'ng-zorro-antd/modal';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { trackById } from '../../helpers/angular.helper';
import { ExecuteService } from '../../services/execute.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelRepository } from '../../stores/channel.repository';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { ProjectRepository } from '../../stores/project.repository';


@Component({
  selector: 'dc-combined-log',
  templateUrl: './combined-log.component.html',
  styleUrls: ['./combined-log.component.scss'],
})
export class CombinedLogComponent {

  readonly fasPlay = faPlay;
  readonly fasRedo = faRedo;
  readonly fasStop = faStop;
  readonly fasBroom = faBroom;

  readonly ExecuteStatus = ExecuteStatus;
  readonly trackById = trackById;
  subs = new SubSink();

  channels$: Observable<Channel[]>;
  channelColors$: Observable<Record<string, string>>;
  executingStatuses$: Observable<ExecuteStatus[]>;
  anythingExecuting$: Observable<boolean>;
  anythingNotExecuting$: Observable<boolean>;

  constructor(
    private readonly modal: NzModalService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly executeService: ExecuteService,
    private readonly globalLogsRepository: GlobalLogsRepository,
    private readonly channelRepository: ChannelRepository,
    private readonly channelLogRepository: ChannelLogRepository,
    private readonly projectRepository: ProjectRepository,
  ) {
    this.channels$ = this.channelRepository.channels$.pipe(
      map(channels => channels.filter(channel => channel.active)),
    );
    this.channelColors$ = this.channels$.pipe(
      map(channels => mapValues(keyBy(channels, 'id'), 'color')),
    );
    this.executingStatuses$ = this.channels$.pipe(
      switchMap(channels => combineLatest(channels.map(channel => this.executeService.selectStatus(channel.id)))),
    );
    this.anythingExecuting$ = this.executingStatuses$.pipe(
      map(statuses => !!statuses.find(status => status === ExecuteStatus.RUNNING || status === ExecuteStatus.WAITING)),
    );
    this.anythingNotExecuting$ = this.executingStatuses$.pipe(
      map(statuses => statuses.includes(ExecuteStatus.STOPPED)),
    );
  }

  async runAll() {
    const channels = this.channelRepository.getChannels().filter(channel => channel.active);

    await Promise.all(channels
      .filter(channel => this.executeService.getStatus(channel.id) === ExecuteStatus.STOPPED)
      .map(channel => this.executeService.run(channel, this.projectRepository.getActiveProject().file)),
    );
  }

  async restartAll() {
    const channels = this.channelRepository.getChannels().filter(channel => channel.active);

    await Promise.all(channels
      .filter(channel => this.executeService.getStatus(channel.id) !== ExecuteStatus.STOPPED)
      .map(channel => this.executeService.kill(channel)),
    );
    await Promise.all(channels
      .map(channel => this.executeService.run(channel, this.projectRepository.getActiveProject().file)),
    );
  }

  async stopAll() {
    const channels = this.channelRepository.getChannels().filter(channel => channel.active);

    await Promise.all(channels
      .filter(channel => this.executeService.getStatus(channel.id) !== ExecuteStatus.STOPPED)
      .map(channel => this.executeService.kill(channel)),
    );
  }

  clearAll() {
    this.globalLogsRepository.clearLogs();
    this.channelLogRepository.clearLogs();
  }
}
