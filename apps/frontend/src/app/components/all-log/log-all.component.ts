import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { ExecuteService } from '../../services/execute.service';
import { LogEntry, LogStoreService } from '../../services/log-store.service';
import { Channel } from '../../stores/channel/channel.model';
import { ProjectStoreService } from '../../stores/project-store.service';

@Component({
  selector: 'dc-log-all',
  templateUrl: './log-all.component.html',
  styleUrls: ['./log-all.component.scss'],
})
export class LogAllComponent implements OnInit {

  subs = new SubSink();

  channels$: Observable<Channel[]>;
  log$: Observable<LogEntry[]>;
  executingStatuses$: Observable<boolean[]>;
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

    this.executingStatuses$ = this.channels$.pipe(
      switchMap(channels => combineLatest(channels.map(channel => this.executeService.selectStatus(channel.id)))),
    );

    this.anythingExecuting$ = this.executingStatuses$.pipe(
      map(statuses => !statuses.includes(true)),
    );

    this.anythingNotExecuting$ = this.executingStatuses$.pipe(
      map(statuses => statuses.includes(false)),
    );
    this.log$ = this.projectStore.channel.query
      .selectActiveId()
      .pipe(
        switchMap(id => this.logStoreService.getStore(id)),
      );
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
