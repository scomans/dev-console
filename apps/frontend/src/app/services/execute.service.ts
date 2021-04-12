import { Injectable } from '@angular/core';
import { Channel, ExecuteStatus, LogEntry } from '@dev-console/types';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { mapElectronEvent } from '../helpers/electron.helper';
import { ElectronService } from './electron.service';

export interface ExecuteEvent<E extends string, D extends ExecuteData> {
  event: E;
  data: D;
}

export interface ExecuteData {
  id: string;
}

export interface ExecuteStatusData extends ExecuteData {
  status: ExecuteStatus,
}

export interface ExecuteExitStatusData extends ExecuteStatusData {
  status: ExecuteStatus.STOPPED,
  code: number;
  signal: string;
}

export type ExecuteStatuses = ExecuteExitStatusData | ExecuteStatusData

export type ExecuteDataData = LogEntry & ExecuteData

export type ExecuteDataEvent = ExecuteEvent<'execute-data', ExecuteDataData>;
export type ExecuteStatusEvent = ExecuteEvent<'execute-status', ExecuteStatuses>;

export type ExecuteEvents =
  ExecuteStatusEvent |
  ExecuteDataEvent

let index = 0;

@Injectable({
  providedIn: 'root',
})
export class ExecuteService {

  readonly executeData$: Observable<ExecuteDataEvent>;

  runningExecutes = new Map<string, BehaviorSubject<ExecuteStatus>>();

  constructor(
    private readonly electronService: ElectronService,
  ) {
    this.executeData$ = mapElectronEvent<ExecuteDataEvent>(this.electronService, 'execute-data');

    mapElectronEvent<ExecuteStatusEvent>(this.electronService, 'execute-status')
      .subscribe(({ data }) => {
        this.getRunningExecute(data.id).next(data.status);
      });
  }

  selectStatus(channelId: string) {
    return this.getRunningExecute(channelId);
  }

  getStatus(channelId: string): ExecuteStatus {
    if (this.runningExecutes.has(channelId)) {
      return this.runningExecutes.get(channelId).getValue();
    }
    return ExecuteStatus.STOPPED;
  }

  private getRunningExecute(channelId: string) {
    if (!this.runningExecutes.has(channelId)) {
      this.runningExecutes.set(channelId, new BehaviorSubject<ExecuteStatus>(ExecuteStatus.STOPPED));
    }
    return this.runningExecutes.get(channelId);
  }

  dataOfId(channelId) {
    return this.executeData$.pipe(
      map(data => ({
        id: index++,
        ...data.data,
      })),
      filter(data => data.id === channelId),
    );
  }

  async run(channel: Channel) {
    if (this.electronService.isElectron) {
      await this.electronService.emit<boolean>('execute-run', channel);
    }
  }

  async kill(channelId: string) {
    if (this.electronService.isElectron) {
      return this.electronService.emit<boolean>('execute-kill', channelId);
    }
  }
}
