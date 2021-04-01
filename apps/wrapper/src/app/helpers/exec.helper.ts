import { spawn, SpawnOptionsWithoutStdio } from 'child_process';

export function exec(command: string, args?: ReadonlyArray<string>, options?: SpawnOptionsWithoutStdio): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn(
      command,
      args,
      options,
    );

    let result = '';
    process.stdout.on('data', (data) => {
      result += data.toString();
    });

    process.on('error', err => {
      reject(err);
    });

    process.on('close', () => {
      resolve(result);
    });
  });
}
