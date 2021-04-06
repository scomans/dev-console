import { Injectable } from '@angular/core';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { mapElectronEvent } from '../helpers/electron.helper';
import { Channel } from '../stores/channel/channel.model';
import { ElectronService } from './electron.service';
import { LogEntry } from './log-store.service';

export interface ExecuteEvent<E extends string, D extends ExecuteData> {
  event: E;
  data: D;
}

export interface ExecuteData {
  id: string;
}

export interface ExecuteExitData extends ExecuteData {
  code: number;
  signal: string;
}

export type ExecuteDataData = LogEntry & ExecuteData

export type ExecuteExitEvent = ExecuteEvent<'execute-exit', ExecuteExitData>;
export type ExecuteDataEvent = ExecuteEvent<'execute-data', ExecuteDataData>;

export type ExecuteEvents =
  ExecuteExitEvent |
  ExecuteDataEvent

@Injectable({
  providedIn: 'root',
})
export class ExecuteService {

  readonly executeData$: Observable<ExecuteDataEvent>;
  readonly executeExit$: Observable<ExecuteExitEvent>;

  runningExecutes = new Map<string, BehaviorSubject<boolean>>();

  constructor(
    private readonly electronService: ElectronService,
  ) {
    this.executeData$ = mapElectronEvent<ExecuteExitEvent>(this.electronService, 'execute-data');
    this.executeExit$ = mapElectronEvent<ExecuteExitEvent>(this.electronService, 'execute-exit');
  }

  selectStatus(channelId: string) {
    return merge(
      this.getRunningExecute(channelId),
      this.executeExit$.pipe(
        filter(exit => exit.data.id === channelId),
        map(() => false),
        tap(() => this.getRunningExecute(channelId).next(false)),
      ),
    );
  }

  getStatus(channelId: string) {
    if (this.runningExecutes.has(channelId)) {
      return this.runningExecutes.get(channelId).getValue();
    }
    return false;
  }

  private getRunningExecute(channelId: string) {
    if (!this.runningExecutes.has(channelId)) {
      this.runningExecutes.set(channelId, new BehaviorSubject<boolean>(false));
    }
    return this.runningExecutes.get(channelId);
  }

  dataOfId(channelId) {
    return this.executeData$.pipe(
      map(data => data.data),
      filter(data => data.id === channelId),
    );
  }

  async run(channel: Channel) {
    console.log('RUN', channel.name, channel.id);
    if (this.electronService.isElectron) {
      const result = await this.electronService.emit<boolean>('execute-run', channel);
      // TODO what to do when kill fails?
      let runningExecute = this.getRunningExecute(channel.id);
      runningExecute.next(true);
    }
  }

  async kill(channelId: string) {
    console.log('RUN', channelId);
    if (this.electronService.isElectron) {
      return this.electronService.emit<boolean>('execute-kill', channelId);
    }
  }
}
