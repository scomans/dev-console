import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { APP_ROUTES } from './app.routing';
import { provideHttpClient } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { en_US, NZ_I18N } from 'ng-zorro-antd/i18n';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ProjectStore } from './stores/project.store';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';


export const appConfig: ApplicationConfig = {
  providers: [
    NzModalService,
    NzNotificationService,
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    provideHttpClient(),
    provideAnimationsAsync(),
    { provide: NZ_I18N, useValue: en_US },
    provideAppInitializer(async () => {
      const projectStore = inject(ProjectStore);
      return await projectStore.loadProjects();
    }),
  ],
};
