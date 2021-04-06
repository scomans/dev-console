import { Injectable } from '@angular/core';
import { Store } from '@datorama/akita';
import { StorageService } from '../services/storage.service';
import { persistState } from './persist-store';
import { ProjectQuery } from './project/project.query';
import { ProjectService } from './project/project.service';
import { ProjectStore } from './project/project.store';

export interface GlobalStore {
  projects: {
    store: ProjectStore;
    query: ProjectQuery;
    service: ProjectService;
  };
}

@Injectable({ providedIn: 'root' })
export class GlobalStoreService implements GlobalStore {

  stores: Store[] = [];

  projects: GlobalStore['projects'];

  constructor(
    private readonly storageService: StorageService,
  ) {
    const projectStore = new ProjectStore();
    this.projects = {
      store: projectStore,
      query: new ProjectQuery(projectStore),
      service: new ProjectService(projectStore),
    };
    this.stores.push(projectStore);

    this.init();
  }

  init() {
    persistState({
      storage: {
        getItem: () => this.storageService.get('storage'),
        clear: () => this.storageService.delete('storage'),
        setItem: (value) => {
          console.log(value);
          return this.storageService.set('storage', value);
        },
      },
    }, this.stores);
  }
}
