import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { sleep } from '@dev-console/helpers';
import { Channel, ExecuteStatus, LogEntryWithSource } from '@dev-console/types';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { faEdit, faEraser, faPlay, faRedo, faStop, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ExecutionService } from '../../services/execution.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelStore } from '../../stores/channel.store';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { ProjectRepository } from '../../stores/project.repository';
import { ActivatedRoute } from '@angular/router';
import { isNil } from 'es-toolkit';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NzPopconfirmDirective } from 'ng-zorro-antd/popconfirm';
import { ChannelEditModalComponent } from '../channel-edit-modal/channel-edit-modal.component';
import { LogViewerComponent } from '../log-viewer/log-viewer.component';
import { derivedFrom } from 'ngxtension/derived-from';
import { of, switchMap } from 'rxjs';


@Component({
  selector: 'dc-channel-log',
  templateUrl: './channel-log.component.html',
  styleUrl: './channel-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ChannelEditModalComponent,
    FaIconComponent,
    LogViewerComponent,
    NzButtonComponent,
    NzPopconfirmDirective,
  ],
})
export class ChannelLogComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly projectRepository = inject(ProjectRepository);
  private readonly executeService = inject(ExecutionService);
  private readonly channelStore = inject(ChannelStore);
  private readonly channelLogRepository = inject(ChannelLogRepository);
  private readonly globalLogsRepository = inject(GlobalLogsRepository);
  /* ### ICONS ### */
  protected readonly farQuestionCircle = faQuestionCircle;
  protected readonly fasTrash = faTrash;
  protected readonly fasPlay = faPlay;
  protected readonly fasRedo = faRedo;
  protected readonly fasStop = faStop;
  protected readonly fasEraser = faEraser;
  protected readonly fasEdit = faEdit;

  protected readonly ExecuteStatus = ExecuteStatus;

  protected readonly status: Signal<ExecuteStatus>;
  protected readonly channel = this.channelStore.activeChannel;
  protected readonly logs: Signal<LogEntryWithSource[]>;

  constructor() {
    this.status = derivedFrom(
      [this.channelStore.activeChannel],
      switchMap(([channel]) =>
        channel
          ? this.executeService.selectStatus(channel.id)
          : of(ExecuteStatus.STOPPED),
      ),
      { initialValue: ExecuteStatus.STOPPED },
    );
    this.logs = derivedFrom(
      [this.channelStore.activeId],
      switchMap(([id]) => {
        if (!id) {
          return of([]);
        }
        return this.channelLogRepository.selectLogsByChannelId(id);
      }),
      { initialValue: [] },
    );
  }

  deleteChannel(channel: Channel) {
    this.channelStore.removeChannel(channel.id);
    this.channelStore.setChannelActive(null);
  }

  updateChannel(channel?: Omit<Channel, 'index'>) {
    this.channelStore.updateChannel(channel.id, channel);
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
