import { existsSync, mkdirSync, promises as fsp } from 'fs';
import { stat } from 'fs/promises';
import * as baseRimraf from 'rimraf';
import { promisify } from 'util';

export const rimraf = promisify(baseRimraf);

export async function isDirEmpty(path) {
  const dirIter = await fsp.opendir(path);
  const { done } = await dirIter[Symbol.asyncIterator]().next();
  if (!done) {
    await dirIter.close();
  }
  return done;
}

export function mkdirSyncIfNotExists(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export async function getFileSize(filePath) {
  try {
    const { size } = await stat(filePath);
    return size;
  } catch (err) {
    return -1;
  }
}
