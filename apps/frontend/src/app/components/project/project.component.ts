import { ChangeDetectionStrategy, Component, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { uuidV4 } from '@dev-console/helpers';
import { Channel, ExecuteStatus, Project } from '@dev-console/types';
import { faCircle as farCircle, faClock, faDotCircle as farDotCircle } from '@fortawesome/free-regular-svg-icons';
import { faAlignLeft, faCircle as fasCircle, faDotCircle as fasDotCircle, faGripHorizontal, faLayerGroup, faPlusCircle, faSquareCaretLeft, faSquareCaretRight } from '@fortawesome/free-solid-svg-icons';
import { sortBy } from 'lodash';
import { NzModalService } from 'ng-zorro-antd/modal';
import { concat, Observable, ReplaySubject, share, switchMap } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ExecutionService } from '../../services/execution.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelRepository } from '../../stores/channel.repository';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { ProjectRepository } from '../../stores/project.repository';
import { UiRepository } from '../../stores/ui.repository';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { windowListenAsObservable } from '../../helpers/tauri.helper';
import { TauriEvent } from '@tauri-apps/api/event';
import { exit } from '@tauri-apps/api/process';

type ChannelWithStatus = Channel & { status$: Observable<ExecuteStatus> };

@Component({
  selector: 'dc-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ExecutionService,
    ChannelRepository,
    ChannelLogRepository,
    GlobalLogsRepository,
    UiRepository,
  ],
})
export class ProjectComponent {

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

  channels$: Observable<ChannelWithStatus[]>;
  selectedChannelId$: Observable<string>;
  project$: Observable<Project>;
  allLogs$: Observable<boolean>;
  sidebarCollapsed = toSignal(this.uiRepository.selectProp('sidebarCollapsed'));

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly activatedRoute: ActivatedRoute,
    private readonly modal: NzModalService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly executeService: ExecutionService,
    private readonly router: Router,
    private readonly channelRepository: ChannelRepository,
    private readonly channelLogRepository: ChannelLogRepository,
    private readonly globalLogsRepository: GlobalLogsRepository,
    private readonly uiRepository: UiRepository,
    private readonly titleService: Title,
  ) {
    this.project$ = this.activatedRoute.queryParams.pipe(
      switchMap(params => this.projectRepository.selectProject(params['projectId'])),
      tap(project => {
        if (!project) {
          return this.router.navigate(['/']);
        }
        titleService.setTitle(`${project.name} - DevConsole`);
      }),
      share({ connector: () => new ReplaySubject(1), resetOnRefCountZero: true }),
    );
    this.selectedChannelId$ = this.channelRepository.activeChannelId$;
    this.allLogs$ = this.selectedChannelId$.pipe(
      map(activeId => !activeId),
    );
    this.channels$ = this.channelRepository.channels$.pipe(
      map(channels => sortBy(channels, 'index')),
      map(channels => channels.map(channel => ({
        ...channel,
        status$: this.executeService.selectStatus(channel.id),
      }))),
    );
    this.project$.pipe(
      takeUntilDestroyed(),
      switchMap(project => concat(
        this.channelRepository.loadChannels(project.file),
        this.channelRepository.persistChannels(project.file),
      )),
    ).subscribe();
    windowListenAsObservable(TauriEvent.WINDOW_CLOSE_REQUESTED)
      .pipe(
        takeUntilDestroyed(),
        switchMap(() => this.checkRunning()),
        switchMap(async close => {
          if (close) {
            await this.executeService.killAll();
            return exit(0);
          }
        }),
      )
      .subscribe();
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

  async checkRunning() {
    let hasRunning = false;
    const channels = this.channelRepository.getChannels();
    for (const channel of channels) {
      const status = this.executeService.getStatus(channel.id);
      if (status !== ExecuteStatus.STOPPED) {
        hasRunning = true;
        break;
      }
    }

    if (hasRunning) {
      return await new Promise<boolean>(resolve => {
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
      await this.executeService.killAll();
      return this.router.navigate(['/']);
    }
  }

  changeOrder(updates: { id: string; index: number }[]) {
    for (const update of updates) {
      this.channelRepository.updateChannel(update.id, { index: update.index });
    }
  }

}
