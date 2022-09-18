import { ChangeDetectionStrategy, Component } from '@angular/core';
import { combineLatestWith, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { trackById } from '../../helpers/angular.helper';
import { ElectronService } from '../../services/electron.service';
import { ChannelLogRepository } from '../../stores/channel-log.repository';
import { ChannelRepository } from '../../stores/channel.repository';
import { GlobalLogsRepository } from '../../stores/global-log.repository';
import { LogEntryWithSourceAndColor } from '../log-entry/log-entry.component';


@Component({
  selector: 'dc-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogViewerComponent {

  readonly trackById = trackById;

  log$: Observable<LogEntryWithSourceAndColor[]>;

  constructor(
    private readonly electronService: ElectronService,
    private readonly channelRepository: ChannelRepository,
    private readonly globalLogsRepository: GlobalLogsRepository,
    private readonly channelLogRepository: ChannelLogRepository,
  ) {
  }

  ngOnInit(): void {
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
      );
  }

}
