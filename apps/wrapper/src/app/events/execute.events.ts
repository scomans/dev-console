import { isEmpty } from '@dev-console/helpers';
import { Channel, ExecuteStatus } from '@dev-console/types';
import { ipcMain } from 'electron';
import { parse as parseEnv } from 'envfile';
import * as execa from 'execa';
import { ExecaChildProcess } from 'execa';
import { existsSync, readFileSync } from 'fs';
import { set } from 'lodash';
import { dirname, isAbsolute, join } from 'path';
import { Readable } from 'stream';
import * as terminate from 'terminate';
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

  static async quit() {
    mainWindow = null;
    waitingProcesses.forEach(cancel => cancel('quit'));
    const ids = Array.from(runningProcesses.keys());
    await Promise.all(ids.map(id => kill(id)));
    return true;
  }
}

ipcMain.handle('execute-run', async (event, [channel, projectFile]: [Channel, string]) => {
  try {
    await kill(channel.id);
    if (channel.waitOn?.length > 0) {
      const cancel = CancelToken.build();
      waitingProcesses.set(channel.id, cancel.cancel);
      mainWindow.webContents.send('execute-status', { id: channel.id, status: ExecuteStatus.WAITING });
      sendData(channel, channel.name + ' is waiting to start...', 'info');
      await waitOn({ resources: channel.waitOn }, cancel.token);
      waitingProcesses.delete(channel.id);
    }
    const process = exec(channel, projectFile);
    runningProcesses.set(channel.id, process);
    mainWindow.webContents.send('execute-status', { id: channel.id, status: ExecuteStatus.RUNNING });
    sendData(channel, channel.name + ' is now running', 'info');
    return true;
  } catch (err) {
    console.error(err);
    mainWindow.webContents.send('execute-status', { id: channel.id, status: ExecuteStatus.STOPPED });
    sendData(channel, channel.name + ' failed to start!', 'info');
    return false;
  }
});

ipcMain.handle('execute-kill', async (event, [id]) => {
  try {
    await kill(id);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
});

function kill(id: string) {
  if (waitingProcesses.has(id)) {
    const cancel = waitingProcesses.get(id);
    cancel('kill');
    waitingProcesses.delete(id);
  }
  if (runningProcesses.has(id)) {
    return new Promise<void>((resolve, reject) => {
      const process = runningProcesses.get(id);
      terminate(process.pid, (err) => {
        if (err?.message !== 'kill ESRCH') {
          return reject(err);
        }
        runningProcesses.delete(id);
        resolve();
      });
    });
  }
}

// can not be async!
function exec(channel: Channel, projectFile: string) {
  if (channel.regex?.search) {
    set(channel, 'regex.searchRegex', new RegExp(channel.regex.search));
  }

  let cwd = isEmpty(channel.executeIn) ? '.' : channel.executeIn;
  if (!isAbsolute(cwd)) {
    cwd = join(dirname(projectFile), cwd);
  }

  let env: Record<string, string> = {};
  let envFile = channel.envFile;
  if (!isEmpty(envFile)) {
    if (!isAbsolute(envFile)) {
      envFile = join(dirname(projectFile), envFile);
    }
    if (existsSync(envFile)) {
      const envFileContent = readFileSync(envFile, { encoding: 'utf8' });
      env = parseEnv(envFileContent);
    }
  }

  const process = execa(
    channel.executable,
    (channel.arguments ?? []),
    {
      cwd,
      stripFinalNewline: false,
      encoding: 'utf8',
      env: {
        FORCE_COLOR: 'true',
        ...(channel.envVars ?? {}),
        ...env,
      },
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
      sendData(channel, channel.name + ' exited', 'info');
    }
  });
  return process;
}

function sendData(channel, data: string, type: 'data' | 'error' | 'info') {
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
