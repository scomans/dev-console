import { Routes } from '@angular/router';
import { ProjectSelectionComponent } from './components/project-selection/project-selection.component';
import { ProjectComponent } from './components/project/project.component';


export const routes: Routes = [
  {
    path: '',
    component: ProjectSelectionComponent,
  },
  {
    path: 'project',
    component: ProjectComponent,
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
