import { Project } from '@dev-console/types';
import { ProjectStore } from './project.store';

export class ProjectService {

  constructor(
    private readonly channelStore: ProjectStore,
  ) {
  }

  add(channel: Project) {
    this.channelStore.add(channel);
  }

  update(id, channel: Partial<Project>) {
    this.channelStore.update(id, channel);
  }

  remove(id: string) {
    this.channelStore.remove(id);
  }

  setActive(id: string) {
    this.channelStore.setActive(id);
  }
}
