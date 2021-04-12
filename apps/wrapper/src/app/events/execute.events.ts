import { Channel, ExecuteStatus } from '@dev-console/types';
import { ipcMain } from 'electron';
import * as execa from 'execa';
import { ExecaChildProcess } from 'execa';
import { set } from 'lodash';
import { Readable } from 'stream';
import { CancelToken } from '../helpers/cancel.helper';
import { waitOn } from '../helpers/wait-on.helper';
import { addLine } from './log.events';

let mainWindow: Electron.BrowserWindow = null;

const runningProcesses = new Map<string, ExecaChildProcess<string>>();
const waitingProcesses = new Map<string, ((message) => void)>();


export default class ExecuteEvents {
  static bootstrapExecuteEvents(): Electron.IpcMain {
    return ipcMain;
  }

  static setMainWindow(win: Electron.BrowserWindow) {
    mainWindow = win;
  }

  static quit() {
    mainWindow = null;
    runningProcesses.forEach(value => value.kill());
    waitingProcesses.forEach(cancel => cancel('quit'));
    return true;
  }
}

ipcMain.handle('execute-run', async (event, [channel]: [Channel]) => {
  try {
    if (kill(channel.id)) {
      if (channel.waitOn?.length > 0) {
        const cancel = CancelToken.build();
        waitingProcesses.set(channel.id, cancel.cancel);
        mainWindow.webContents.send('execute-status', { id: channel.id, status: ExecuteStatus.WAITING });
        await waitOn({ resources: channel.waitOn }, cancel.token);
        waitingProcesses.delete(channel.id);
      }
      const process = exec(channel);
      runningProcesses.set(channel.id, process);
      mainWindow.webContents.send('execute-status', { id: channel.id, status: ExecuteStatus.RUNNING });
      return true;
    }
  } catch (err) {
    console.error(err);
    mainWindow.webContents.send('execute-status', { id: channel.id, status: ExecuteStatus.STOPPED });
    return false;
  }
});

ipcMain.handle('execute-kill', (event, [id]) => {
  return kill(id);
});

function kill(id: string) {
  if (runningProcesses.has(id)) {
    const process = runningProcesses.get(id);
    const result = process.kill();
    if (result) {
      runningProcesses.delete(id);
    }
    return result;
  }
  if (waitingProcesses.has(id)) {
    const cancel = waitingProcesses.get(id);
    waitingProcesses.delete(id);
    cancel('kill');
  }
  return true;
}

function exec(channel) {
  if (channel.regex?.search) {
    set(channel, 'regex.searchRegex', new RegExp(channel.regex.search));
  }

  const process = execa(
    channel.executable,
    (channel.arguments ?? []),
    {
      cwd: channel.executeIn,
      stripFinalNewline: true,
      encoding: 'utf8',
      env: { FORCE_COLOR: 'true' },
    },
  );

  emitLines(process.stdout);
  emitLines(process.stderr);

  process.stdout.on('line-data', (data) => sendData(channel, data.toString(), 'data'));
  process.stderr.on('line-data', (data) => sendData(channel, data.toString(), 'error'));

  process.on('exit', (code, signal) => {
    runningProcesses.delete(channel.id);
    if (mainWindow) {
      mainWindow.webContents.send('execute-status', { id: channel.id, status: ExecuteStatus.STOPPED, code, signal });
    }
  });
  return process;
}

function sendData(channel, data: string, type: 'data' | 'error') {
  if (mainWindow) {
    if (channel.regex?.searchRegex) {
      data = data.replace(channel.regex.searchRegex, channel.regex.replace ?? '');
    }

    addLine(channel.id, {
      id: channel.id,
      data: data,
      type,
      timestamp: Date.now(),
    });
  }
}

function emitLines(stream: Readable) {
  let dataBacklog = '';
  stream.on('data', (data) => {
    dataBacklog += data;
    let n = dataBacklog.indexOf('\n');
    // got a \n? emit one or more 'line' events
    while (~n) {
      let line = dataBacklog.substring(0, n);
      // line = iconv.decode(Buffer.from(line), 'win874');
      stream.emit('line-data', line);
      dataBacklog = dataBacklog.substring(n + 1);
      n = dataBacklog.indexOf('\n');
    }
  });
  stream.on('end', function () {
    if (dataBacklog) {
      stream.emit('line-data', dataBacklog);
    }
  });
}
