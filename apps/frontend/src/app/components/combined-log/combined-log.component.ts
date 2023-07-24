import { ChangeDetectionStrategy, Component, ViewContainerRef } from '@angular/core';
import { Channel, ExecuteStatus } from '@dev-console/types';
import { faEraser, faPlay, faRedo, faStop } from '@fortawesome/free-solid-svg-icons';
import { keyBy, mapValues } from 'lodash';
import { NzModalService } from 'ng-zorro-antd/modal';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ExecutionService } from '../../services/execution.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelRepository } from '../../stores/channel.repository';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { ProjectRepository } from '../../stores/project.repository';
import { ActivatedRoute } from '@angular/router';
import { sleep } from '@dev-console/helpers';
import { RxLet } from '@rx-angular/template/let';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LogViewerComponent } from '../log-viewer/log-viewer.component';


@Component({
  selector: 'dc-combined-log',
  templateUrl: './combined-log.component.html',
  styleUrls: ['./combined-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FontAwesomeModule,
    LogViewerComponent,
    NzButtonModule,
    RxLet,
  ],
})
export class CombinedLogComponent {

  readonly fasPlay = faPlay;
  readonly fasRedo = faRedo;
  readonly fasStop = faStop;
  readonly fasEraser = faEraser;

  channels$: Observable<Channel[]>;
  channelColors$: Observable<Record<string, string>>;
  executingStatuses$: Observable<ExecuteStatus[]>;
  anythingExecuting$: Observable<boolean>;
  anythingNotExecuting$: Observable<boolean>;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly modal: NzModalService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly executeService: ExecutionService,
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
    const projectId = this.activatedRoute.snapshot.queryParams['projectId'];
    const projectFile = this.projectRepository.getProject(projectId)?.file;

    await Promise.all(channels
      .filter(channel => this.executeService.getStatus(channel.id) === ExecuteStatus.STOPPED)
      .map(channel => this.executeService.run(channel, projectFile)),
    );
  }

  async restartAll() {
    await this.stopAll();
    await sleep(1000);
    await this.runAll();
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
