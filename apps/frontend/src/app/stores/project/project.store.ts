import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Project } from '@dev-console/types';

export interface ProjectState extends EntityState<Project, string> {
}

@StoreConfig({ name: 'Project' })
export class ProjectStore extends EntityStore<ProjectState> {

  constructor() {
    super();
  }
}
