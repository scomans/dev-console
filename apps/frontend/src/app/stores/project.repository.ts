import { Injectable, OnDestroy } from '@angular/core';
import { Project } from '@dev-console/types';
import { createStore } from '@ngneat/elf';
import { addEntities, deleteEntities, getActiveEntity, getAllEntities, getEntity, selectActiveEntity, selectActiveId, selectAllEntities, selectEntity, setActiveId, updateEntities, withActiveId, withEntities } from '@ngneat/elf-entities';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class ProjectRepository implements OnDestroy {

  private store = createStore(
    { name: 'project' },
    withEntities<Project>(),
    withActiveId(),
  );

  private persist = persistState(this.store, {
    key: 'project',
    storage: localStorageStrategy,
    // preStoreInit: value => {
    //   console.log(value)
    //   return ({ ...value, activeId: null });
    // }
  });
  projects$ = this.persist.initialized$.pipe(
    filter(init => init),
    switchMap(() => this.store),
    selectAllEntities(),
  );
  activeProject$ = this.persist.initialized$.pipe(
    filter(init => init),
    switchMap(() => this.store),
    selectActiveEntity(),
  );
  activeProjectId$: Observable<string> = this.persist.initialized$.pipe(
    filter(init => init),
    switchMap(() => this.store),
    selectActiveId(),
  );

  ngOnDestroy() {
    this.persist?.unsubscribe();
  }

  selectProject(id: string) {
    return this.persist.initialized$.pipe(
      filter(init => init),
      switchMap(() => this.store),
      selectEntity(id),
    );
  }

  addProject(project: Project) {
    this.store.update(
      addEntities(project),
    );
  }

  updateProject(id: string, project: Partial<Project>) {
    this.store.update(
      updateEntities(id, project),
    );
  }

  removeProject(id: string) {
    this.store.update(
      deleteEntities(id),
    );
  }

  getProjects() {
    return this.store.query(getAllEntities());
  }

  getProject(id: string) {
    return this.store.query(getEntity(id));
  }

  getActiveProject() {
    return this.store.query(getActiveEntity());
  }

  setProjectActive(id: string) {
    this.store.update(
      setActiveId(id),
    );
  }

}
