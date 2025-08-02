import { ChangeDetectionStrategy, Component, computed, effect, inject, Signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { Observable, ReplaySubject, share, switchMap } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ExecutionService } from '../../services/execution.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelStore } from '../../stores/channel.store';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { ProjectRepository } from '../../stores/project.repository';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { windowListenAsObservable } from '../../helpers/tauri.helper';
import { TauriEvent } from '@tauri-apps/api/event';
import { exit } from '@tauri-apps/api/process';
import { NzContentComponent, NzLayoutComponent, NzSiderComponent } from 'ng-zorro-antd/layout';
import { AsyncPipe } from '@angular/common';
import { NzMenuDirective, NzMenuItemComponent, NzSubMenuComponent } from 'ng-zorro-antd/menu';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ChannelLogComponent } from '../channel-log/channel-log.component';
import { CombinedLogComponent } from '../combined-log/combined-log.component';
import { ChannelOrderModalComponent } from '../channel-order-modal/channel-order-modal.component';
import { ChannelEditModalComponent } from '../channel-edit-modal/channel-edit-modal.component';
import { ExitModalComponent } from '../exit-modal/exit-modal.component';
import { v4 } from 'uuid';

type ChannelWithStatus = Channel & { status$: Observable<ExecuteStatus> };

@Component({
  selector: 'dc-project',
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ExecutionService,
    ChannelStore,
    ChannelLogRepository,
    GlobalLogsRepository,
  ],
  imports: [
    AsyncPipe,
    ChannelEditModalComponent,
    ChannelLogComponent,
    ChannelOrderModalComponent,
    CombinedLogComponent,
    ExitModalComponent,
    FaIconComponent,
    NzContentComponent,
    NzLayoutComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzSiderComponent,
    NzSubMenuComponent,
  ],
})
export class ProjectComponent {
  private readonly projectRepository = inject(ProjectRepository);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly modal = inject(NzModalService);
  private readonly executeService = inject(ExecutionService);
  private readonly router = inject(Router);
  private readonly channelStore = inject(ChannelStore);
  private readonly titleService = inject(Title);
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
  protected readonly selectedChannelId = this.channelStore.activeId;
  protected readonly project: Signal<Project | undefined>;
  protected readonly allLogs: Signal<boolean>;

  protected readonly exitModal = viewChild(ExitModalComponent);

  constructor() {
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
    this.allLogs = computed(() => !this.selectedChannelId());
    this.channels = computed(() => {
      return this.channelStore
        .entities()
        .sort((a, b) => a.index - b.index)
        .map(channel => ({
          ...channel,
          status$: this.executeService.selectStatus(channel.id),
        }));
    });
    effect(async () => {
      const project = this.project();
      await this.channelStore.loadChannels(project.file);
      await this.channelStore.persistChannels(project.file);
    });
    effect(async () => {
      this.channelStore.entities();
      const project = this.project();
      if (project && this.channelStore.loaded()) {
        await this.channelStore.persistChannels(project.file);
      }
    });

    windowListenAsObservable(TauriEvent.WINDOW_CLOSE_REQUESTED)
      .pipe(
        takeUntilDestroyed(),
        switchMap(() => this.checkRunning()),
        switchMap(async close => {
          if (close && !this.exitModal().visible()) {
            this.exitModal().show();
            await this.executeService.killAll();
            await exit(0);
          }
        }),
      )
      .subscribe();
  }

  openChannel(id: string) {
    this.channelStore.setChannelActive(id);
  }

  async addChannel(channel?: Omit<Channel, 'index'>) {
    this.channelStore.addChannel({
      ...channel,
      index: Math.max(0, ...this.channelStore.entities().map(c => c.index)) + 1,
      id: v4(),
    });
  }

  async checkRunning() {
    let hasRunning = false;
    const channels = this.channelStore.entities();
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

  async changeOrder(updates: { id: string; index: number }[]) {
    this.channelStore.updateChannels(updates);
  }
}
