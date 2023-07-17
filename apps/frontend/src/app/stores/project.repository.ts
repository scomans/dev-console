import { Injectable, OnDestroy } from '@angular/core';
import { Project } from '@dev-console/types';
import { createStore } from '@ngneat/elf';
import {
  addEntities,
  deleteEntities,
  getAllEntities,
  getEntity,
  selectAllEntities,
  selectEntity,
  updateEntities,
  withEntities,
} from '@ngneat/elf-entities';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { filter, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class ProjectRepository implements OnDestroy {

  private store = createStore(
    { name: 'project' },
    withEntities<Project>(),
  );

  private persist = persistState(this.store, {
    key: 'project',
    storage: localStorageStrategy,
  });
  projects$ = this.persist.initialized$.pipe(
    filter(init => init),
    switchMap(() => this.store),
    selectAllEntities(),
  );

  ngOnDestroy(): void {
    this.persist?.unsubscribe();
  }

  addProject(project: Project): void {
    this.store.update(
      addEntities(project),
    );
  }

  updateProject(id: string, project: Partial<Project>): void {
    this.store.update(
      updateEntities(id, project),
    );
  }

  removeProject(id: string): void {
    this.store.update(
      deleteEntities(id),
    );
  }

  getProjects(): Project[] {
    return this.store.query(getAllEntities());
  }

  getProject(id: string): Project {
    return this.store.query(getEntity(id));
  }

  selectProject(id: string): Observable<Project> {
    return this.store.pipe(selectEntity(id));
  }

}
