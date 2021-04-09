import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { Channel, ExecuteStatus } from '@dev-console/types';
import { keyBy, mapValues } from 'lodash';
import { NzModalService } from 'ng-zorro-antd/modal';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { trackById } from '../../helpers/angular.helper';
import { ExecuteService } from '../../services/execute.service';
import { LogEntryWithSource, LogStoreService } from '../../services/log-store.service';
import { ProjectStoreService } from '../../stores/project-store.service';

@Component({
  selector: 'dc-log-all',
  templateUrl: './log-all.component.html',
  styleUrls: ['./log-all.component.scss'],
})
export class LogAllComponent implements OnInit {

  ExecuteStatus = ExecuteStatus;
  trackById = trackById;
  subs = new SubSink();

  channels$: Observable<Channel[]>;
  channelColors$: Observable<Record<string, string>>;
  log$: Observable<LogEntryWithSource[]>;
  executingStatuses$: Observable<ExecuteStatus[]>;
  anythingExecuting$: Observable<boolean>;
  anythingNotExecuting$: Observable<boolean>;

  constructor(
    private readonly projectStore: ProjectStoreService,
    private readonly modal: NzModalService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly logStoreService: LogStoreService,
    private readonly executeService: ExecuteService,
  ) {
  }

  ngOnInit() {
    this.channels$ = this.projectStore.channel.query
      .selectAll()
      .pipe(
        map(channels => channels.filter(channel => channel.active)),
      );
    this.channelColors$ = this.channels$.pipe(
      map(channels => mapValues(keyBy(channels, 'id'), 'color')),
    );

    this.executingStatuses$ = this.channels$.pipe(
      switchMap(channels => combineLatest(channels.map(channel => this.executeService.selectStatus(channel.id)))),
    );

    this.anythingExecuting$ = this.executingStatuses$.pipe(
      map(statuses => !!statuses.find(status => status === ExecuteStatus.RUNNING || status === ExecuteStatus.WAITING)),
    );

    this.anythingNotExecuting$ = this.executingStatuses$.pipe(
      map(statuses => statuses.includes(ExecuteStatus.STOPPED)),
    );
    this.log$ = this.logStoreService.allStoreSubject.asObservable();
  }

  async runAll() {
    const channels = this.projectStore.channel.query.getAll().filter(channel => channel.active);

    for (let channel of channels) {
      const running = this.executeService.getStatus(channel.id);
      if (!running) {
        await this.executeService.run(channel);
      }
    }
  }

  async restartAll() {
    const channels = this.projectStore.channel.query.getAll().filter(channel => channel.active);

    for (let channel of channels) {
      const running = this.executeService.getStatus(channel.id);
      if (running) {
        await this.executeService.kill(channel.id);
      }
      await this.executeService.run(channel);
    }
  }

  async stopAll() {
    const channels = this.projectStore.channel.query.getAll().filter(channel => channel.active);

    for (let channel of channels) {
      const running = this.executeService.getStatus(channel.id);
      if (running) {
        await this.executeService.kill(channel.id);
      }
    }
  }
}
