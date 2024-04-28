import { ChangeDetectionStrategy, Component, Signal } from '@angular/core';
import { filterNil, sleep } from '@dev-console/helpers';
import { Channel, ExecuteStatus, LogEntryWithSource } from '@dev-console/types';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { faEdit, faEraser, faPlay, faRedo, faStop, faTrash } from '@fortawesome/free-solid-svg-icons';
import { switchMap } from 'rxjs/operators';
import { ExecutionService } from '../../services/execution.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelRepository } from '../../stores/channel.repository';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { ProjectRepository } from '../../stores/project.repository';
import { ActivatedRoute } from '@angular/router';
import { isNil } from 'lodash-es';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { ChannelEditModalComponent } from '../channel-edit-modal/channel-edit-modal.component';
import { LogViewerComponent } from '../log-viewer/log-viewer.component';
import { toSignal } from '@angular/core/rxjs-interop';


@Component({
  selector: 'dc-channel-log',
  templateUrl: './channel-log.component.html',
  styleUrls: ['./channel-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ChannelEditModalComponent,
    FaIconComponent,
    LogViewerComponent,
    NzButtonModule,
    NzPopconfirmModule,
  ],
})
export class ChannelLogComponent {

  protected readonly farQuestionCircle = faQuestionCircle;
  protected readonly fasTrash = faTrash;
  protected readonly fasPlay = faPlay;
  protected readonly fasRedo = faRedo;
  protected readonly fasStop = faStop;
  protected readonly fasEraser = faEraser;
  protected readonly fasEdit = faEdit;

  protected readonly ExecuteStatus = ExecuteStatus;

  protected readonly status: Signal<ExecuteStatus>;
  protected readonly channel: Signal<Channel | undefined>;
  protected readonly logs: Signal<LogEntryWithSource[]>;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly projectRepository: ProjectRepository,
    private readonly executeService: ExecutionService,
    private readonly channelRepository: ChannelRepository,
    private readonly channelLogRepository: ChannelLogRepository,
    private readonly globalLogsRepository: GlobalLogsRepository,
  ) {
    this.channel = toSignal(this.channelRepository.activeChannel$, { initialValue: undefined });
    this.status = toSignal(
      this.channelRepository.activeChannelId$
        .pipe(
          filterNil(),
          switchMap(id => this.executeService.selectStatus(id)),
        ),
      { initialValue: ExecuteStatus.STOPPED },
    );
    this.logs = toSignal(
      this.channelRepository.activeChannelId$
        .pipe(
          switchMap(id => this.channelLogRepository.selectLogsByChannelId(id)),
        ),
      { initialValue: [] },
    );
  }

  deleteChannel(channel: Channel) {
    this.channelRepository.removeChannel(channel.id);
    this.channelRepository.setChannelActive(null);
  }

  updateChannel(channel?: Omit<Channel, 'index'>) {
    this.channelRepository.updateChannel(channel.id, channel);
  }

  async run(channel: Channel) {
    const projectId = this.activatedRoute.snapshot.queryParams['projectId'];
    const projectFile = this.projectRepository.getProject(projectId)?.file;
    if (!isNil(projectFile)) {
      await this.executeService.run(channel, projectFile);
    }
  }

  async restart(channel: Channel) {
    const killed = await this.stop(channel);
    if (killed) {
      await sleep(1000);
      await this.run(channel);
    }
  }

  stop(channel: Channel) {
    return this.executeService.kill(channel);
  }

  clearChannel(channel: Channel) {
    void this.channelLogRepository.clearChannelLogs(channel.id);
    void this.globalLogsRepository.clearChannelLogs(channel.id);
  }

}
