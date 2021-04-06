import { Injectable } from '@angular/core';
import { doOnSubscribe } from '@dev-console/helpers';
import { EMPTY, merge, Observable } from 'rxjs';
import { filter, finalize, map } from 'rxjs/operators';
import { ElectronService } from './electron.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectStorageService {

  private readonly onUpdate$: Observable<[string, any, any]> = EMPTY;

  constructor(
    private readonly electronService: ElectronService,
  ) {
    if (this.electronService.isElectron) {
      this.onUpdate$ = this.electronService.on<[string, any, any]>('project-store-value-changed');
    }
  }

  async open(file: string) {
    if (this.electronService.isElectron) {
      return this.electronService.emit('project-store-open', file);
    }
    return false;
  }

  async get<T>(key: string, def?: T) {
    if (this.electronService.isElectron) {
      return this.electronService.emit<T>('project-store-get', key, def);
    } else {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) as T : def;
    }
  }

  async set(key: string, value: any) {
    if (this.electronService.isElectron) {
      return this.electronService.emit<void>('project-store-set', key, value);
    } else {
      return localStorage.setItem(key, JSON.stringify(value));
    }
  }

  async delete(key: string) {
    if (this.electronService.isElectron) {
      return this.electronService.emit<void>('project-store-delete', key);
    } else {
      return localStorage.removeItem(key);
    }
  }

  async sync(fromKey: string, toKey: string) {
    if (this.electronService.isElectron) {
      return this.electronService.emit<void>('project-store-sync', fromKey, toKey);
    }
  }

  async unsync(fromKey: string, toKey: string) {
    if (this.electronService.isElectron) {
      return this.electronService.emit<void>('project-store-unsync', fromKey, toKey);
    }
  }

  getAndUpdate<T>(key: string, def?: T): Observable<T> {
    return merge(
      this.get<T>(key, def),
      this.onUpdate<T>(key),
    );
  }

  onUpdate<T>(key: string): Observable<T> {
    return this.onUpdate$.pipe(
      doOnSubscribe(() => this.electronService.emit('project-store-register-watcher', key)),
      filter<[string, any, any]>(([event]) => event === key),
      map(([, newVal]) => newVal),
      finalize(() => this.electronService.emit('project-store-unregister-watcher', key)),
    );
  }
}
