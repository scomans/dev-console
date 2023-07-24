import { listen, TauriEvent } from '@tauri-apps/api/event';
import { exists, FsDirOptions, FsOptions, readDir, readTextFile, removeDir, removeFile, writeTextFile } from '@tauri-apps/api/fs';
import { Command } from '@tauri-apps/api/shell';
import { invoke } from '@tauri-apps/api/tauri';
import { Observable } from 'rxjs';
import { JsonValue } from 'type-fest';
import { SafeAny } from '@dev-console/types';
import { appWindow } from '@tauri-apps/api/window';
import { inject, NgZone } from '@angular/core';

export async function readJsonFile(path: string): Promise<JsonValue> {
  const content = await readTextFile(path);
  return JSON.parse(content);
}

export async function writeJsonFile(path: string, content: JsonValue, format = true): Promise<void> {
  content = JSON.stringify(content, null, format ? 2 : 0);
  await writeTextFile(path, content);
}

export async function isDirEmpty(path: string): Promise<boolean> {
  const entries = await readDir(path);
  return entries.length === 0;
}

export async function removeFileIfExist(file: string, options?: FsOptions): Promise<void> {
  const fileExists = await exists(file, options);
  if (fileExists) {
    await removeFile(file, options);
  }
}

export async function removeDirIfExist(dir: string, options?: FsDirOptions): Promise<void> {
  const fileExists = await exists(dir, options);
  if (fileExists) {
    await removeDir(dir, options);
  }
}

export async function openDirectory(folder: string): Promise<void> {
  await new Command('open-folder', folder).execute();
}

export async function openDevtools(): Promise<void> {
  await invoke('open_devtools');
}

export function listenAsObservable<T extends SafeAny>(event: TauriEvent | string): Observable<T> {
  const zone = inject(NgZone);
  return new Observable(subscriber => {
    const unlisten = listen<T>(event, (event) => {
      zone.run(() => {
        subscriber.next(event.payload);
      });
    });
    return async () => {
      (await unlisten)();
    };
  });
}

export function windowListenAsObservable<T extends SafeAny>(event: TauriEvent | string): Observable<T> {
  const zone = inject(NgZone);
  return new Observable(subscriber => {
    const unlisten = appWindow.listen<T>(event, (event) => {
      zone.run(() => {
        subscriber.next(event.payload);
      });
    });
    return async () => {
      (await unlisten)();
    };
  });
}
