import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { Channel, ExecuteStatus } from '@dev-console/types';
import { faEraser, faPlay, faRedo, faStop } from '@fortawesome/free-solid-svg-icons';
import { combineLatest } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ExecutionService } from '../../services/execution.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelStore } from '../../stores/channel.store';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { ProjectRepository } from '../../stores/project.repository';
import { ActivatedRoute } from '@angular/router';
import { mapBy, mapObjectValues, sleep } from '@dev-console/helpers';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LogViewerComponent } from '../log-viewer/log-viewer.component';
import { derivedFrom } from 'ngxtension/derived-from';


@Component({
  selector: 'dc-combined-log',
  templateUrl: './combined-log.component.html',
  styleUrl: './combined-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FaIconComponent,
    LogViewerComponent,
    NzButtonComponent,
  ],
})
export class CombinedLogComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly executeService = inject(ExecutionService);
  private readonly globalLogsRepository = inject(GlobalLogsRepository);
  private readonly channelStore = inject(ChannelStore);
  private readonly channelLogRepository = inject(ChannelLogRepository);
  private readonly projectRepository = inject(ProjectRepository);
  /* ### ICONS ### */
  protected readonly fasPlay = faPlay;
  protected readonly fasRedo = faRedo;
  protected readonly fasStop = faStop;
  protected readonly fasEraser = faEraser;

  protected readonly activeChannels: Signal<Channel[]>;
  protected readonly channelColors: Signal<Record<string, string>>;
  protected readonly executingStatuses: Signal<ExecuteStatus[]>;
  protected readonly anythingExecuting: Signal<boolean>;
  protected readonly anythingNotExecuting: Signal<boolean>;

  constructor() {
    this.activeChannels = computed(() => this.channelStore.entities().filter(c => c.active));
    this.channelColors = computed(() => mapObjectValues(mapBy(this.activeChannels(), 'id'), 'color'));
    this.executingStatuses = derivedFrom(
      [this.activeChannels],
      switchMap(([activeChannels]) =>
        combineLatest(activeChannels.map(c => this.executeService.selectStatus(c.id))),
      ),
      { initialValue: [] },
    );
    this.anythingExecuting = computed(() => {
      const statuses = this.executingStatuses();
      return statuses.some(status => status === ExecuteStatus.RUNNING || status === ExecuteStatus.WAITING);
    });
    this.anythingNotExecuting = computed(() => {
      const statuses = this.executingStatuses();
      return statuses.includes(ExecuteStatus.STOPPED);
    });
  }

  async runAll() {
    const channels = this.channelStore.entities().filter(channel => channel.active);
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
    const channels = this.channelStore.entities().filter(channel => channel.active);

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
