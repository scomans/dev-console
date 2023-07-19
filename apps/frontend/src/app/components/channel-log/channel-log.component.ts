import { ChangeDetectionStrategy, Component, OnInit, ViewContainerRef } from '@angular/core';
import { filterNil, sleep } from '@dev-console/helpers';
import { Channel, ExecuteStatus, LogEntryWithSource } from '@dev-console/types';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { faBroom, faEdit, faPlay, faRedo, faStop, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ExecutionService } from '../../services/execution.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelRepository } from '../../stores/channel.repository';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { ProjectRepository } from '../../stores/project.repository';
import { ActivatedRoute } from '@angular/router';
import { isNil } from 'lodash';
import { RxIf } from '@rx-angular/template/if';
import { RxLet } from '@rx-angular/template/let';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { ChannelEditModalComponent } from '../channel-edit-modal/channel-edit-modal.component';
import { LogViewerComponent } from '../log-viewer/log-viewer.component';


@Component({
  selector: 'dc-channel-log',
  templateUrl: './channel-log.component.html',
  styleUrls: ['./channel-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ChannelEditModalComponent,
    FontAwesomeModule,
    LogViewerComponent,
    NzButtonModule,
    NzPopconfirmModule,
    RxIf,
    RxLet,
  ],
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

  status$: Observable<ExecuteStatus>;
  channel$: Observable<Channel>;
  logs$: Observable<LogEntryWithSource[]>;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly projectRepository: ProjectRepository,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly executeService: ExecutionService,
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
