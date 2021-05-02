import { Project } from '@dev-console/types';
import { ProjectStore } from './project.store';

export class ProjectService {

  constructor(
    private readonly projectStore: ProjectStore,
  ) {
  }

  add(channel: Project) {
    this.projectStore.add(channel);
  }

  update(id, channel: Partial<Project>) {
    this.projectStore.update(id, channel);
  }

  remove(id: string) {
    this.projectStore.remove(id);
  }
}
