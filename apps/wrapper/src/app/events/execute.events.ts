import { ChildProcess } from 'child_process';
import { ipcMain } from 'electron';
import * as execa from 'execa';
import { Readable } from 'stream';

let mainWindow: Electron.BrowserWindow = null;

const runningProcesses = new Map<string, ChildProcess>();


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
    return true;
  }
}

ipcMain.handle('execute-run', (event, [channel]) => {
  if (kill(channel.id)) {
    const process = exec(channel);
    runningProcesses.set(channel.id, process);
    return true;
  }
  return false;
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
  return true;
}

function exec(channel) {
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
  process.stdout.on('line-data', function (data) {
    if (mainWindow) {
      mainWindow.webContents.send('execute-data', {
        id: channel.id,
        data: data.toString(),
        type: 'data',
        timestamp: Date.now(),
      });
    }
  });
  process.stderr.on('line-data', function (data) {
    if (mainWindow) {
      mainWindow.webContents.send('execute-data', {
        id: channel.id,
        data: data.toString(),
        type: 'error',
        timestamp: Date.now(),
      });
    }
  });
  process.on('exit', (code, signal) => {
    runningProcesses.delete(channel.id);
    if (mainWindow) {
      mainWindow.webContents.send('execute-exit', { id: channel.id, code, signal });
    }
  });
  return process;
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
