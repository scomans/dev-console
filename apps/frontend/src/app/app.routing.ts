import { Routes } from '@angular/router';
import { LogComponent } from './components/log/log.component';

export const routes: Routes = [
  {
    path: '',
    component: LogComponent,
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
