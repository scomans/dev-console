import { Component, OnInit } from '@angular/core';
import { filterNil } from '@dev-console/helpers';
import { Channel, LogEntryWithSource } from '@dev-console/types';
import { from, merge, Observable } from 'rxjs';
import { filter, map, scan, startWith, switchMap } from 'rxjs/operators';
import { trackById } from '../../helpers/angular.helper';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'cl-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss'],
})
export class LogViewerComponent implements OnInit {

  trackById = trackById;

  log$: Observable<LogEntryWithSource[]>;
  colors$: Observable<Record<string, string>>;

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
            acc.push(...entries);
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
}
