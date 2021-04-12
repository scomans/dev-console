import { Routes } from '@angular/router';
import { LogViewerComponent } from './components/log-viewer/log-viewer.component';
import { ProjectSelectionComponent } from './components/project-selection/project-selection.component';
import { ProjectComponent } from './components/project/project.component';

export const routes: Routes = [
  {
    path: '',
    component: ProjectSelectionComponent,
  },
  {
    path: 'project/:projectId',
    component: ProjectComponent,
  },
  {
    path: 'log',
    component: LogViewerComponent,
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
