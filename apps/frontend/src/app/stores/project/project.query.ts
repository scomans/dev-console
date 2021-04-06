import { QueryEntity } from '@datorama/akita';
import { ProjectState, ProjectStore } from './project.store';

export class ProjectQuery extends QueryEntity<ProjectState> {

  constructor(protected store: ProjectStore) {
    super(store);
  }
}
