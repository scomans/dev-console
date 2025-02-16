import { Injectable } from '@angular/core';
import { Channel, ExecuteStatus, LogEntryWithSource } from '@dev-console/types';
import { BehaviorSubject, from, lastValueFrom, merge, Observable, takeWhile } from 'rxjs';
import { ChannelLogRepository } from '../stores/channel-log.repository';
import { GlobalLogsRepository } from '../stores/global-log.repository';
import { isNil } from 'es-toolkit';
import { listenAsObservable } from '../helpers/tauri.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { dirname, isAbsolute, join } from '@tauri-apps/api/path';
import { ChannelRepository } from '../stores/channel.repository';
import { waitFor } from '../helpers/wait-for.helper';
import { CancelToken } from '../helpers/cancel.helper';
import { map } from 'rxjs/operators';
import { exists, readTextFile } from '@tauri-apps/api/fs';
import { parse as parseEnv } from 'envfile';
import { killProcess, spawnProcess } from '../types/tauri';
import { default as Convert } from 'ansi-to-html';
import { autoLink } from '../helpers/autolink.helper';
import { DomSanitizer } from '@angular/platform-browser';

let index = 0;
const ansiToHtmlConverter = new Convert();

export interface Executable {
  status: BehaviorSubject<ExecuteStatus>;
  cancelWaitOn?: (message: string) => void;
  pid?: number;
  replacer?: (line: string) => string;
}

@Injectable()
export class ExecutionService {

  executables = new Map<string, Executable>();

  constructor(
    private readonly channelLogRepository: ChannelLogRepository,
    private readonly globalLogsRepository: GlobalLogsRepository,
    private readonly channelRepository: ChannelRepository,
    private readonly sanitizer: DomSanitizer,
  ) {
    listenAsObservable('process-stdout')
      .pipe(takeUntilDestroyed())
      .subscribe(({ channel_id: channelId, line }: { channel_id: string, line: string }) => {
        this.addLogLine(channelId, line, 'data');
      });
    listenAsObservable('process-stderr')
      .pipe(takeUntilDestroyed())
      .subscribe(({ channel_id: channelId, line }: { channel_id: string, line: string }) => {
        this.addLogLine(channelId, line, 'error');
      });
    listenAsObservable('process-exit')
      .pipe(takeUntilDestroyed())
      .subscribe(({ channel_id: channelId, code }: { channel_id: string, code: number }) => {
        const channel = this.channelRepository.getChannel(channelId);
        this.addLogLine(
          channelId,
          `ℹ️ ${ channel.name } exited with exit code: ${ Number(code) }`,
          'info',
        );
        this.executables.get(channel.id)?.status.next(ExecuteStatus.STOPPED);
      });
  }

  private addLogLine(channelId: string, line: string, type: 'data' | 'error' | 'info') {
    const executable = this.executables.get(channelId);

    if (!isNil(executable?.replacer)) {
      line = executable.replacer(line);
    }
    line = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    line = ansiToHtmlConverter.toHtml(line);
    line = autoLink(line, { target: '_blank' });

    const logEntry: LogEntryWithSource = {
      id: index++,
      timestamp: new Date().getTime(),
      data: this.sanitizer.bypassSecurityTrustHtml(line),
      type,
      source: channelId,
    };
    this.channelLogRepository.addLine(logEntry);
    this.globalLogsRepository.addLines([logEntry]);
  }

  selectStatus(channelId: string): Observable<ExecuteStatus> {
    return this.getRunningExecute(channelId);
  }

  getStatus(channelId: string): ExecuteStatus {
    if (this.executables.has(channelId)) {
      return this.executables.get(channelId).status.getValue();
    }
    return ExecuteStatus.STOPPED;
  }

  private getRunningExecute(channelId: string): Observable<ExecuteStatus> {
    if (!this.executables.has(channelId)) {
      this.executables.set(channelId, {
        status: new BehaviorSubject<ExecuteStatus>(ExecuteStatus.STOPPED),
      });
    }
    return this.executables.get(channelId)?.status.asObservable();
  }

  async run(channel: Channel, projectFile: string) {
    if (!this.executables.has(channel.id)) {
      let replacer: ((line: string) => string) | undefined;
      if (!isNil(channel.regex?.search)) {
        const regex = new RegExp(channel.regex.search);
        replacer = (line: string) => line.replace(regex, channel.regex.replace);
      }
      this.executables.set(channel.id, {
        status: new BehaviorSubject(ExecuteStatus.STOPPED),
        replacer,
      });
    }

    if (channel.waitOn?.length > 0) {
      this.executables.get(channel.id).status.next(ExecuteStatus.WAITING);
      this.addLogLine(
        channel.id,
        `ℹ️ ${ channel.name } is waiting to start...`,
        'info',
      );
      const waiter = CancelToken.build();
      this.executables.get(channel.id).cancelWaitOn = waiter.cancel;
      try {
        await lastValueFrom(
          merge(
            from(waiter.token.promise).pipe(map(() => waiter.token.throwIfRequested())),
            waitFor(channel.waitOn),
          ).pipe(
            takeWhile(() => false, true),
          ),
        );
        this.executables.get(channel.id).cancelWaitOn = undefined;
      } catch (e) {
        if (waiter.token.isCancelled()) {
          this.addLogLine(
            channel.id,
            `ℹ️ Waiting stopped for ${ channel.name }`,
            'info',
          );
          this.executables.get(channel.id).status.next(ExecuteStatus.STOPPED);
          return;
        }
        throw e;
      }
    }
    this.addLogLine(
      channel.id,
      `ℹ️ Starting ${ channel.name } >>> ${ channel.executable } ${ channel.arguments.join(' ') }`,
      'info',
    );

    const projectDir = await dirname(projectFile);

    let cwd = channel.executeIn ?? '.';
    const absolute = await isAbsolute(cwd);
    if (!absolute) {
      cwd = await join(projectDir, cwd);
    }

    let env: Record<string, string> = {};
    let envFile = channel.envFile;
    if (!isNil(envFile)) {
      if (!await isAbsolute(envFile)) {
        envFile = await join(projectDir, envFile);
      }
      if (await exists(envFile)) {
        const envFileContent = await readTextFile(envFile);
        env = parseEnv(envFileContent);
      }
    }
    env = { ...env, ...channel.envVars };

    const pid = await spawnProcess(channel.id,
      channel.executable,
      channel.arguments,
      cwd,
      env,
    );

    if (pid === -1) {
      return;
    }

    const executable = this.executables.get(channel.id);
    executable.status.next(ExecuteStatus.RUNNING);
    executable.pid = pid;
    this.addLogLine(
      channel.id,
      `ℹ️ ${ channel.name } started with PID: ${ pid }`,
      'info',
    );
  }

  async kill(channel: Channel) {
    const pid = this.executables.get(channel.id)?.pid;
    if (!isNil(pid)) {
      const result = await killProcess(pid);
      this.addLogLine(
        channel.id,
        `ℹ️ Killed ${ result.length - 1 } child processes of ${ channel.name }`,
        'info',
      );
      return result; // TODO check result
    }
    const cancel = this.executables.get(channel.id)?.cancelWaitOn;
    if (!isNil(cancel)) {
      cancel('KILLED');
    }
    return false;
  }

  async killAll() {
    const executables = this.executables.values();
    await Promise.all(
      [...executables].map(async (executable) => {
        if (!isNil(executable.pid)) {
          await killProcess(executable.pid);
        }
      }),
    );
  }
}
