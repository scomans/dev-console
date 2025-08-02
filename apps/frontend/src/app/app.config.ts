import { ApplicationConfig } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { APP_ROUTES } from './app.routing';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { en_US, NZ_I18N } from 'ng-zorro-antd/i18n';
import { NzModalService } from 'ng-zorro-antd/modal';


export const appConfig: ApplicationConfig = {
  providers: [
    NzModalService,
    NzNotificationService,
    provideRouter(APP_ROUTES, withHashLocation()),
    provideHttpClient(),
    provideAnimations(),
    { provide: NZ_I18N, useValue: en_US },
  ],
};
