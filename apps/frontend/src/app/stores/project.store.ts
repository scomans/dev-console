import { computed } from '@angular/core';
import { Project } from '@dev-console/types';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntity, removeEntity, setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';

export interface ProjectState {
  activeId: string | null;
  loaded: boolean;
}

const initialState: ProjectState = {
  activeId: null,
  loaded: false,
};

export const ProjectStore = signalStore(
  { providedIn: 'root', protectedState: false },
  withState(initialState),
  withEntities<Project>(),
  withComputed(({ activeId, entityMap }) => ({
    activeProject: computed(() => activeId() ? entityMap()[activeId()] : null),
  })),
  withMethods((store) => ({
    addProject(project: Project): void {
      patchState(store, addEntity(project));
    },
    updateProject(id: string, project: Partial<Project>): void {
      patchState(store, updateEntity({ id, changes: project }));
    },
    removeProject(id: string): void {
      patchState(store, removeEntity(id));
    },
    setProjectActive(activeId: string | null): void {
      patchState(store, () => ({ activeId }));
    },
    async loadProjects() {
      const legacyProjectsJson = localStorage.getItem('project');
      if (legacyProjectsJson) {
        const legacyProjects = JSON.parse(legacyProjectsJson);
        const projects = Object.values(legacyProjects.entities);
        localStorage.setItem('projects', JSON.stringify(projects));
        localStorage.removeItem('project');
      }

      const projectsJson = localStorage.getItem('projects');
      if (projectsJson) {
        const projects = JSON.parse(projectsJson);
        patchState(store, setAllEntities(projects));
      }

      patchState(store, { loaded: true });
    },
    async persistProjects(): Promise<void> {
      const projects = [...store.entities()];
      localStorage.setItem('projects', JSON.stringify(projects));
    },
  })),
);
