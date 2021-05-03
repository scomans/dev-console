import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { filterNil } from '@dev-console/helpers';
import { Channel, LogEntryWithSource } from '@dev-console/types';
import { from, merge, Observable } from 'rxjs';
import { filter, first, map, scan, startWith, switchMap } from 'rxjs/operators';
import { ElectronService } from '../../services/electron.service';
import { LogMinimapComponent } from '../log-minimap/log-minimap.component';

@Component({
  selector: 'cl-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogViewerComponent implements OnInit {

  log$: Observable<LogEntryWithSource[]>;
  colors$: Observable<Record<string, string>>;
  loading$: Observable<boolean>;

  @ViewChild(LogMinimapComponent)
  set minimap(value: LogMinimapComponent) {
    if (value) {
      this.loading$ = value.drawThrottle.pipe(
        filterNil(),
        first(),
        map(() => false),
        startWith(true),
      );
    }
  }

  constructor(
    private readonly electronService: ElectronService,
  ) {
  }

  ngOnInit(): void {
    const data$ = this.electronService
      .on<[{ mode: string, channel?: Channel, colors?: Record<string, string> }]>('webview-data')
      .pipe(
        map(data => data[0]),
        filterNil(),
      );
    this.colors$ = data$.pipe(
      map(data => data.colors),
      startWith({}),
    );

    this.log$ = data$.pipe(
      filter(data => !!data.mode),
      switchMap(data => {
        let initialLogSource$: Observable<LogEntryWithSource[]>;
        let newLineLogSource$: Observable<LogEntryWithSource[]> = this.electronService.on('log-new-line');
        if (data.mode === 'channel') {
          initialLogSource$ = from(this.electronService.emit<LogEntryWithSource[]>('log-get', data.channel.id));
          newLineLogSource$ = newLineLogSource$.pipe(
            filter(line => line[0].source === data.channel.id),
          );
        } else {
          initialLogSource$ = from(this.electronService.emit<LogEntryWithSource[]>('log-get-all'));
        }
        return merge(
          initialLogSource$,
          newLineLogSource$,
        ).pipe(
          scan((acc, entries) => {
            acc = [
              ...acc,
              ...entries,
            ];
            while (acc.length > 1000) {
              acc.shift();
            }
            return acc;
          }, []),
        );
      }),
    );

    this.electronService.sendToHost('webview-ready');
  }

  distinct() {
    return false;
  }
}
