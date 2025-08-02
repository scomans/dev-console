import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, viewChild } from '@angular/core';
import { combineLatest, of, pipe } from 'rxjs';
import { LogStore } from '../../stores/log.store';
import { ChannelStore } from '../../stores/channel.store';
import { LogEntryComponent, LogEntryWithSourceAndColor } from '../log-entry/log-entry.component';
import { AutoScrollDirective } from '../../directives/auto-scroll.directive';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDownLong, faEdit, faEraser, faPlay, faRedo, faStop, faTrash } from '@fortawesome/free-solid-svg-icons';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { NzEmptyComponent } from 'ng-zorro-antd/empty';
import { derivedFrom } from 'ngxtension/derived-from';
import { auditTime, map, switchMap } from 'rxjs/operators';
import { NzPopconfirmDirective } from 'ng-zorro-antd/popconfirm';
import { Channel, ExecuteStatus } from '@dev-console/types';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { mapObjectValues, sleep } from '@dev-console/helpers';
import { ExecutionService } from '../../services/execution.service';
import { ActivatedRoute } from '@angular/router';
import { ProjectStore } from '../../stores/project.store';
import { ChannelEditModalComponent } from '../channel-edit-modal/channel-edit-modal.component';
import { isNil } from 'es-toolkit';


@Component({
  selector: 'dc-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrl: './log-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AutoScrollDirective,
    ChannelEditModalComponent,
    FaIconComponent,
    LogEntryComponent,
    NzButtonComponent,
    NzEmptyComponent,
    NzPopconfirmDirective,
    NzTooltipDirective,
  ],
})
export class LogViewerComponent {
  private readonly executeService = inject(ExecutionService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly projectStore = inject(ProjectStore);
  private readonly channelStore = inject(ChannelStore);
  private readonly logStore = inject(LogStore);
  /* ### ICONS ### */
  protected readonly fasDownLong = faDownLong;
  protected readonly fasPlay = faPlay;
  protected readonly fasStop = faStop;
  protected readonly fasEraser = faEraser;
  protected readonly fasRedo = faRedo;
  protected readonly fasEdit = faEdit;
  protected readonly farQuestionCircle = faQuestionCircle;
  protected readonly fasTrash = faTrash;

  protected readonly ExecuteStatus = ExecuteStatus;

  protected readonly showScrollDownButton = signal(false);
  protected readonly logEntries: Signal<LogEntryWithSourceAndColor[]>;
  protected readonly logEntriesDebounce: Signal<LogEntryWithSourceAndColor[]>;
  protected readonly channel = this.channelStore.activeChannel;
  protected readonly channelColors: Signal<Record<string, string>>;
  protected readonly runActionRunning = signal(false);
  protected readonly restartActionRunning = signal(false);
  protected readonly stopActionRunning = signal(false);

  protected readonly status: Signal<ExecuteStatus>;
  protected readonly activeChannels: Signal<Channel[]>;
  protected readonly executingStatuses: Signal<ExecuteStatus[]>;
  protected readonly anythingExecuting: Signal<boolean>;
  protected readonly anythingNotExecuting: Signal<boolean>;

  protected readonly autoScroll = viewChild(AutoScrollDirective);

  constructor() {
    this.activeChannels = computed(() => this.channelStore.entities().filter(c => c.active));
    this.channelColors = computed(() => mapObjectValues(this.channelStore.entityMap(), 'color'));

    this.status = derivedFrom(
      [this.channelStore.activeChannel],
      switchMap(([channel]) =>
        channel
          ? this.executeService.selectStatus(channel.id)
          : of(ExecuteStatus.STOPPED),
      ),
      { initialValue: ExecuteStatus.STOPPED },
    );
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

    this.logEntries = computed(() => {
      const c = this.channelColors();
      return this.logStore.activeChannelLogs()
        .map(e => ({ ...e, color: c[e.source] }));
    });
    this.logEntriesDebounce = derivedFrom(
      [this.logEntries],
      pipe(
        auditTime(50),
        map(([entries]) => entries),
      ),
      { initialValue: [] },
    );
  }

  updateScrollButtonVisibility(show: boolean) {
    this.showScrollDownButton.set(show);
  }

  scrollDown() {
    this.autoScroll()?.scrollDown();
  }

  deleteChannel(channel: Channel) {
    this.channelStore.removeChannel(channel.id);
    this.channelStore.setChannelActive(null);
  }

  updateChannel(channel?: Omit<Channel, 'index'>) {
    this.channelStore.updateChannel(channel.id, channel);
  }

  async run(channel?: Channel) {
    this.runActionRunning.set(true);
    if (channel) {
      const projectId = this.activatedRoute.snapshot.queryParams['projectId'];
      const projectFile = this.projectStore.entityMap()[projectId]?.file;
      if (!isNil(projectFile)) {
        await this.executeService.run(channel, projectFile);
      }
    } else {
      const channels = this.channelStore.entities().filter(channel => channel.active);
      const projectId = this.activatedRoute.snapshot.queryParams['projectId'];
      const projectFile = this.projectStore.entityMap()[projectId]?.file;

      await Promise.all(channels
        .filter(channel => this.executeService.getStatus(channel.id) === ExecuteStatus.STOPPED)
        .map(channel => this.executeService.run(channel, projectFile)),
      );
    }
    this.runActionRunning.set(false);
  }

  async restart(channel?: Channel) {
    this.restartActionRunning.set(true);
    if (channel) {
      await this.stop(channel);
      await sleep(1000);
      await this.run(channel);
    } else {
      await this.stop();
      await sleep(1000);
      await this.run();
    }
    this.restartActionRunning.set(false);
  }

  async stop(channel?: Channel) {
    this.stopActionRunning.set(true);
    if (channel) {
      await this.executeService.kill(channel);
    } else {
      const channels = this.channelStore.entities().filter(channel => channel.active);

      await Promise.all(channels
        .filter(channel => this.executeService.getStatus(channel.id) !== ExecuteStatus.STOPPED)
        .map(channel => this.executeService.kill(channel)),
      );
    }
    this.stopActionRunning.set(false);
  }

  clearLogs(channel?: Channel) {
    if (channel) {
      this.logStore.clearChannelLogs(channel.id);
    } else {
      this.logStore.clearLogs();
    }
  }
}
