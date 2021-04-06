import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Project } from './project.model';

export interface ProjectState extends EntityState<Project, string> {
}

@StoreConfig({ name: 'Project' })
export class ProjectStore extends EntityStore<ProjectState> {

  constructor() {
    super();
  }
}
