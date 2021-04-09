import { Injectable } from '@angular/core';
import { Store } from '@datorama/akita';
import { Project } from '@dev-console/types';
import { ProjectStorageService } from '../services/project-storage.service';
import { ChannelQuery } from './channel/channel.query';
import { ChannelService } from './channel/channel.service';
import { ChannelStore } from './channel/channel.store';
import { PersistState, persistState } from './persist-store';
import { UiQuery } from './ui/ui.query';
import { UiService } from './ui/ui.service';
import { UiStore } from './ui/ui.store';

export interface ProjectStore {
  ui: {
    store: UiStore;
    query: UiQuery;
    service: UiService;
  };
  channel: {
    store: ChannelStore;
    query: ChannelQuery;
    service: ChannelService;
  };
}

@Injectable({ providedIn: 'root' })
export class ProjectStoreService implements ProjectStore {

  stores: Store[] = [];

  ui: ProjectStore['ui'];
  channel: ProjectStore['channel'];

  currentProject: PersistState;

  constructor(
    private readonly storageService: ProjectStorageService,
  ) {
    const uiStore = new UiStore();
    this.ui = {
      store: uiStore,
      query: new UiQuery(uiStore),
      service: new UiService(uiStore),
    };
    this.stores.push(uiStore);

    const channelStore = new ChannelStore();
    this.channel = {
      store: channelStore,
      query: new ChannelQuery(channelStore),
      service: new ChannelService(channelStore),
    };
    this.stores.push(channelStore);
  }

  async openProject(project: Project) {
    if (this.currentProject) {
      this.currentProject.destroy();
      for (const store of this.stores) {
        store.reset();
      }
    }

    await this.storageService.open(project.file);

    this.currentProject = persistState({
      storage: {
        getItem: () => this.storageService.get('storage'),
        clear: () => this.storageService.delete('storage'),
        setItem: (value) => this.storageService.set('storage', value),
      },
    }, this.stores);
  }
}
