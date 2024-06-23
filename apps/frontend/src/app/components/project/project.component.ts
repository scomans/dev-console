import { ChangeDetectionStrategy, Component, computed, Signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { uuidV4 } from '@dev-console/helpers';
import { Channel, ExecuteStatus, Project } from '@dev-console/types';
import { faCircle as farCircle, faClock, faDotCircle as farDotCircle } from '@fortawesome/free-regular-svg-icons';
import {
  faAlignLeft,
  faCircle as fasCircle,
  faDotCircle as fasDotCircle,
  faGripHorizontal,
  faLayerGroup,
  faPlusCircle,
} from '@fortawesome/free-solid-svg-icons';
import { NzModalService } from 'ng-zorro-antd/modal';
import { concat, Observable, ReplaySubject, share, switchMap } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ExecutionService } from '../../services/execution.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelRepository } from '../../stores/channel.repository';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { ProjectRepository } from '../../stores/project.repository';
import { UiRepository } from '../../stores/ui.repository';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { windowListenAsObservable } from '../../helpers/tauri.helper';
import { TauriEvent } from '@tauri-apps/api/event';
import { exit } from '@tauri-apps/api/process';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { AsyncPipe } from '@angular/common';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ChannelLogComponent } from '../channel-log/channel-log.component';
import { CombinedLogComponent } from '../combined-log/combined-log.component';
import { ChannelOrderModalComponent } from '../channel-order-modal/channel-order-modal.component';
import { ChannelEditModalComponent } from '../channel-edit-modal/channel-edit-modal.component';
import { ExitModalComponent } from '../exit-modal/exit-modal.component';
import { saveWindowState, StateFlags } from 'tauri-plugin-window-state-api';

type ChannelWithStatus = Channel & { status$: Observable<ExecuteStatus> };

@Component({
  selector: 'dc-project',
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    ExecutionService,
    ChannelRepository,
    ChannelLogRepository,
    GlobalLogsRepository,
    UiRepository,
  ],
  imports: [
    AsyncPipe,
    ChannelEditModalComponent,
    ChannelLogComponent,
    ChannelOrderModalComponent,
    CombinedLogComponent,
    ExitModalComponent,
    FaIconComponent,
    NzButtonModule,
    NzLayoutModule,
    NzMenuModule,
    NzToolTipModule,
  ],
})
export class ProjectComponent {

  /* ### ICONS ### */
  protected readonly fasAlignLeft = faAlignLeft;
  protected readonly fasCircle = fasCircle;
  protected readonly farCircle = farCircle;
  protected readonly farClock = faClock;
  protected readonly fasDotCircle = fasDotCircle;
  protected readonly farDotCircle = farDotCircle;
  protected readonly fasLayerGroup = faLayerGroup;
  protected readonly fasPlusCircle = faPlusCircle;
  protected readonly fasGripHorizontal = faGripHorizontal;

  /* ### ENUMS ### */
  protected readonly ExecuteStatus = ExecuteStatus;

  /* ### COMPONENT ### */
  protected readonly channels: Signal<ChannelWithStatus[]>;
  protected readonly selectedChannelId: Signal<string | undefined>;
  protected readonly project: Signal<Project | undefined>;
  protected readonly allLogs: Signal<boolean>;

  @ViewChild(ExitModalComponent, { static: true }) exitModal: ExitModalComponent;

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly activatedRoute: ActivatedRoute,
    private readonly modal: NzModalService,
    private readonly executeService: ExecutionService,
    private readonly router: Router,
    private readonly channelRepository: ChannelRepository,
    private readonly titleService: Title,
  ) {
    this.project = toSignal(
      this.activatedRoute.queryParams.pipe(
        switchMap(params => this.projectRepository.selectProject(params['projectId'])),
        tap(project => {
          if (!project) {
            return this.router.navigate(['/']);
          }
          this.titleService.setTitle(`${ project.name } - DevConsole`);
        }),
        share({ connector: () => new ReplaySubject(1), resetOnRefCountZero: true }),
      ),
      { initialValue: undefined },
    );
    this.selectedChannelId = toSignal(
      this.channelRepository.activeChannelId$,
      { initialValue: undefined },
    );
    this.allLogs = computed(() => !this.selectedChannelId());
    this.channels = toSignal(
      this.channelRepository.channels$.pipe(
        map(channels => channels.sort((a, b) => a.index - b.index)),
        map(channels => channels.map(channel => ({
          ...channel,
          status$: this.executeService.selectStatus(channel.id),
        }))),
      ),
      { initialValue: [] },
    );
    toObservable(this.project).pipe(
      switchMap(project => concat(
        this.channelRepository.loadChannels(project.file),
        this.channelRepository.persistChannels(project.file),
      )),
      takeUntilDestroyed(),
    ).subscribe();
    windowListenAsObservable(TauriEvent.WINDOW_CLOSE_REQUESTED)
      .pipe(
        takeUntilDestroyed(),
        switchMap(() => this.checkRunning()),
        switchMap(async close => {
          if (close && !this.exitModal.visible()) {
            this.exitModal.show();
            await this.executeService.killAll();
            await saveWindowState(StateFlags.SIZE + StateFlags.POSITION + StateFlags.MAXIMIZED);
            await exit(0);
          }
        }),
      )
      .subscribe();
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
          nzContent: 'Closing the project will stop all running channels!',
          nzCentered: true,
          nzMaskClosable: false,
          nzClosable: false,
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
