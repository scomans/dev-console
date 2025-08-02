import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, viewChild } from '@angular/core';
import { Subject, take } from 'rxjs';
import { LogStore } from '../../stores/log.store';
import { ChannelStore } from '../../stores/channel.store';
import { LogEntryComponent, LogEntryWithSourceAndColor } from '../log-entry/log-entry.component';
import { AutoScrollDirective } from '../../directives/auto-scroll.directive';
import {
  AutoSizeVirtualScrollStrategy,
  RxVirtualFor,
  RxVirtualScrollViewportComponent,
} from '@rx-angular/template/experimental/virtual-scrolling';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDownLong } from '@fortawesome/free-solid-svg-icons';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzEmptyComponent } from 'ng-zorro-antd/empty';


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
    NzButtonComponent,
    NzEmptyComponent,
    NzTooltipDirective,
    RxVirtualFor,
    RxVirtualScrollViewportComponent,
  ],
})
export class LogViewerComponent {
  private readonly channelStore = inject(ChannelStore);
  private readonly logStore = inject(LogStore);
  /* ### ICONS ### */
  protected readonly fasDownLong = faDownLong;

  protected readonly showScrollDownButton = signal(false);
  protected readonly logEntries: Signal<LogEntryWithSourceAndColor[]>;
  protected readonly itemsRendered = new Subject<any>();

  protected readonly autoScroll = viewChild(AutoScrollDirective);

  constructor() {
    this.itemsRendered
      .pipe(takeUntilDestroyed(), take(1))
      .subscribe(() => this.scrollDown());
    const colors: Signal<Record<string, string>> = computed(() => {
      return this.channelStore
        .entities()
        .map(c => ({ id: c.id, color: c.color }))
        .reduce((a, v) => ({ ...a, [v.id]: v.color }), {});
    });
    this.logEntries = computed(() => {
      const c = colors();
      return this.logStore.activeChannelLogs()
        .map(e => ({ ...e, color: c[e.source] }));
    });
  }

  updateScrollButtonVisibility(show: boolean) {
    this.showScrollDownButton.set(show);
  }

  scrollDown() {
    this.autoScroll()?.scrollDown();
  }
}
