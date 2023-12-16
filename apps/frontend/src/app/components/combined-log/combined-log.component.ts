import { ChangeDetectionStrategy, Component, Signal } from '@angular/core';
import { Channel, ExecuteStatus } from '@dev-console/types';
import { faEraser, faPlay, faRedo, faStop } from '@fortawesome/free-solid-svg-icons';
import { keyBy, mapValues } from 'lodash-es';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ExecutionService } from '../../services/execution.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelRepository } from '../../stores/channel.repository';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { ProjectRepository } from '../../stores/project.repository';
import { ActivatedRoute } from '@angular/router';
import { sleep } from '@dev-console/helpers';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LogViewerComponent } from '../log-viewer/log-viewer.component';
import { toSignal } from '@angular/core/rxjs-interop';


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
  ],
})
export class CombinedLogComponent {

  protected readonly fasPlay = faPlay;
  protected readonly fasRedo = faRedo;
  protected readonly fasStop = faStop;
  protected readonly fasEraser = faEraser;

  protected readonly channels$: Observable<Channel[]>;
  protected readonly channelColors$: Observable<Record<string, string>>;
  protected readonly executingStatuses$: Observable<ExecuteStatus[]>;
  protected readonly anythingExecuting: Signal<boolean>;
  protected readonly anythingNotExecuting: Signal<boolean>;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
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
    this.anythingExecuting = toSignal(
      this.executingStatuses$.pipe(
        map(statuses => !!statuses.find(status => status === ExecuteStatus.RUNNING || status === ExecuteStatus.WAITING)),
      ),
      { initialValue: false },
    );
    this.anythingNotExecuting = toSignal(
      this.executingStatuses$.pipe(
        map(statuses => statuses.includes(ExecuteStatus.STOPPED)),
      ),
      { initialValue: false },
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
