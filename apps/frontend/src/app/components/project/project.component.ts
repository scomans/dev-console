import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { uuidV4 } from '@dev-console/helpers';
import { Channel, ExecuteStatus, Project } from '@dev-console/types';
import { faCircle as farCircle, faClock, faDotCircle as farDotCircle } from '@fortawesome/free-regular-svg-icons';
import { faAlignLeft, faCircle as fasCircle, faDotCircle as fasDotCircle, faGripHorizontal, faLayerGroup, faPlusCircle, faSquareCaretLeft, faSquareCaretRight } from '@fortawesome/free-solid-svg-icons';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable, takeUntil } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DestroyService } from '../../services/destroy.service';
import { ElectronService } from '../../services/electron.service';
import { ExecuteService } from '../../services/execute.service';
import { ProjectStorageService } from '../../services/project-storage.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelRepository } from '../../stores/channel.repository';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { ProjectRepository } from '../../stores/project.repository';
import { UiRepository } from '../../stores/ui.repository';


@Component({
  selector: 'dc-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    DestroyService,
    ProjectStorageService,
    ChannelRepository,
    ChannelLogRepository,
    GlobalLogsRepository,
    UiRepository,
  ],
})
export class ProjectComponent implements OnInit, OnDestroy {

  readonly fasAlignLeft = faAlignLeft;
  readonly fasCircle = fasCircle;
  readonly farCircle = farCircle;
  readonly farClock = faClock;
  readonly fasDotCircle = fasDotCircle;
  readonly farDotCircle = farDotCircle;
  readonly fasLayerGroup = faLayerGroup;
  readonly fasPlusCircle = faPlusCircle;
  readonly fasGripHorizontal = faGripHorizontal;
  readonly fasSquareCaretRight = faSquareCaretRight;
  readonly fasSquareCaretLeft = faSquareCaretLeft;

  readonly ExecuteStatus = ExecuteStatus;

  channels$: Observable<Channel[]>;
  selectedChannelId$: Observable<string>;
  project$: Observable<Project>;
  allLogs$: Observable<boolean>;
  sidebarCollapsed$ = this.uiRepository.selectProp('sidebarCollapsed');

  constructor(
    private readonly destroy$: DestroyService,
    private readonly electronService: ElectronService,
    private readonly projectRepository: ProjectRepository,
    private readonly route: ActivatedRoute,
    private readonly modal: NzModalService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly executeService: ExecuteService,
    private readonly router: Router,
    private readonly channelRepository: ChannelRepository,
    private readonly channelLogRepository: ChannelLogRepository,
    private readonly globalLogsRepository: GlobalLogsRepository,
    private readonly uiRepository: UiRepository,
    private readonly storageService: ProjectStorageService,
  ) {
    this.project$ = this.projectRepository.activeProject$.pipe(
      tap(project => {
        if (!project) {
          return this.router.navigate(['/']);
        }
        document.title = `${ project.name } - DevConsole`;
        void this.storageService.open(project.file);
      }),
    );
    this.selectedChannelId$ = this.channelRepository.activeChannelId$;
    this.allLogs$ = this.selectedChannelId$.pipe(
      map(activeId => !activeId),
    );
    this.channels$ = this.channelRepository.channels$.pipe(
      map(channels => channels.sort((a, b) => a.index - b.index)),
    );
  }

  ngOnInit() {
    // this.electronService.registerCloseListener('project-close', switchMap(() => this.checkRunning()));
    this.channelLogRepository.checkForUpdates().pipe(takeUntil(this.destroy$)).subscribe();
    this.globalLogsRepository.checkForUpdates().pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy() {
    // this.electronService.unregisterCloseListener('project-close');
  }

  toggleSidebar() {
    this.uiRepository.toggleSidebar();
  }

  openChannel(id: string) {
    this.channelRepository.setChannelActive(id);
  }

  addChannel(channel?: Omit<Channel, 'index'>) {
    this.channelRepository.addChannel({
      ...channel,
      index: Math.max(0, ...this.channelRepository.getChannels().map(c => c.index)) + 1,
      id: uuidV4(),
    });
  }

  channelStatus = (channelId: string) => {
    return this.executeService.selectStatus(channelId);
  };

  async checkRunning() {
    let hasRunning = false;
    const channels = this.channelRepository.getChannels();
    for (let channel of channels) {
      const status = this.executeService.getStatus(channel.id);
      if (status !== ExecuteStatus.STOPPED) {
        hasRunning = true;
        break;
      }
    }

    if (hasRunning) {
      return new Promise<boolean>(resolve => {
        this.modal.confirm({
          nzTitle: 'Do you want to close this project?',
          nzContent: 'When clicked the OK button, all running channels will be stopped!',
          nzOnOk: () => resolve(true),
          nzOnCancel: () => resolve(false),
        });
      });
    }
    return true;
  }

  async warnRunning() {
    const close = await this.checkRunning();
    if (close) {
      const channels = this.channelRepository.getChannels().filter(channel => channel.active);

      for (let channel of channels) {
        const status = this.executeService.getStatus(channel.id);
        if (status !== ExecuteStatus.STOPPED) {
          await this.executeService.kill(channel);
        }
      }
      return this.router.navigate(['/']);
    }
  }

  changeOrder(updates: { id: string; index: number }[]) {
    for (let update of updates) {
      this.channelRepository.updateChannel(update.id, { index: update.index });
    }
  }

}
