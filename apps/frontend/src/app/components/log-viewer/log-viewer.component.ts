import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { combineLatestWith, debounceTime, Observable, Subject, take } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelRepository } from '../../stores/channel.repository';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { LogEntryComponent, LogEntryWithSourceAndColor } from '../log-entry/log-entry.component';
import { AutoScrollDirective } from '../../directives/auto-scroll.directive';
import { RxFor } from '@rx-angular/template/for';
import {
  AutoSizeVirtualScrollStrategy,
  RxVirtualFor,
  RxVirtualScrollViewportComponent,
} from '@rx-angular/template/experimental/virtual-scrolling';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { RxIf } from '@rx-angular/template/if';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownLong } from '@fortawesome/free-solid-svg-icons';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'dc-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AutoScrollDirective,
    LogEntryComponent,
    RxFor,
    RxVirtualFor,
    AutoSizeVirtualScrollStrategy,
    RxVirtualScrollViewportComponent,
    NzButtonModule,
    RxIf,
    FontAwesomeModule,
    NzToolTipModule,
  ],
})
export class LogViewerComponent {

  /* ### ICONS ### */
  protected readonly fasDownLong = faDownLong;

  protected readonly showScrollDownButton = signal(false);
  protected readonly itemsRendered = new Subject<void>();
  protected readonly log$: Observable<LogEntryWithSourceAndColor[]>;

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
    this.log$ = this.channelRepository.activeChannelId$
      .pipe(
        switchMap(id => id ? this.channelLogRepository.selectLogsByChannelId(id) : this.globalLogsRepository.logEntries$),
        combineLatestWith(colors$),
        map(([entries, colors]) => entries.map(e => ({ ...e, color: colors[e.source] }))),
        debounceTime(100),
      );
  }

  updateScrollButtonVisibility(show: boolean) {
    this.showScrollDownButton.update(() => show);
  }

  scrollDown() {
    this.autoScroll.scrollDown();
  }
}
