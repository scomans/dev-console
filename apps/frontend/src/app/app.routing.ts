import { Routes } from '@angular/router';


export const APP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./components/project-selection/project-selection.component').then(m => m.ProjectSelectionComponent),
  },
  {
    path: 'project',
    loadComponent: () => import('./components/project/project.component').then(m => m.ProjectComponent),
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
