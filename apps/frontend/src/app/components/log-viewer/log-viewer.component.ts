import { ChangeDetectionStrategy, Component, Signal, signal, ViewChild } from '@angular/core';
import { combineLatestWith, Observable, Subject, take } from 'rxjs';
import { auditTime, map, switchMap } from 'rxjs/operators';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelRepository } from '../../stores/channel.repository';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { LogEntryComponent, LogEntryWithSourceAndColor } from '../log-entry/log-entry.component';
import { AutoScrollDirective } from '../../directives/auto-scroll.directive';
import {
  AutoSizeVirtualScrollStrategy,
  RxVirtualFor,
  RxVirtualScrollViewportComponent,
} from '@rx-angular/template/experimental/virtual-scrolling';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDownLong } from '@fortawesome/free-solid-svg-icons';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NzEmptyModule } from 'ng-zorro-antd/empty';


@Component({
  selector: 'dc-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrl: './log-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AutoScrollDirective,
    AutoSizeVirtualScrollStrategy,
    FaIconComponent,
    LogEntryComponent,
    NzButtonModule,
    NzEmptyModule,
    NzTooltipModule,
    RxVirtualFor,
    RxVirtualScrollViewportComponent,
  ],
})
export class LogViewerComponent {

  /* ### ICONS ### */
  protected readonly fasDownLong = faDownLong;

  protected readonly showScrollDownButton = signal(false);
  protected readonly logEntries: Signal<LogEntryWithSourceAndColor[]>;
  protected readonly itemsRendered = new Subject<void>();

  @ViewChild(RxVirtualScrollViewportComponent) viewport: RxVirtualScrollViewportComponent;
  @ViewChild(AutoScrollDirective) autoScroll: AutoScrollDirective;

  constructor(
    private readonly channelRepository: ChannelRepository,
    private readonly globalLogsRepository: GlobalLogsRepository,
    private readonly channelLogRepository: ChannelLogRepository,
  ) {
    this.itemsRendered
      .pipe(takeUntilDestroyed(), take(1))
      .subscribe(() => this.scrollDown());
    const colors$: Observable<Record<string, string>> = this.channelRepository.channels$.pipe(
      map(channels => channels
        .map(c => ({ id: c.id, color: c.color }))
        .reduce((a, v) => ({ ...a, [v.id]: v.color }), {}),
      ),
    );
    this.logEntries = toSignal(
      this.channelRepository.activeChannelId$
        .pipe(
          switchMap(id => id ? this.channelLogRepository.selectLogsByChannelId(id) : this.globalLogsRepository.logEntries$),
          combineLatestWith(colors$),
          map(([entries, colors]) => entries.map(e => ({ ...e, color: colors[e.source] }))),
          auditTime(50),
        ),
      { initialValue: [] },
    );
  }

  updateScrollButtonVisibility(show: boolean) {
    this.showScrollDownButton.set(show);
  }

  scrollDown() {
    this.autoScroll.scrollDown();
  }
}
