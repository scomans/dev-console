import { registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import en from '@angular/common/locales/en';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { en_US, NZ_I18N } from 'ng-zorro-antd/i18n';
import { routes } from './app.routing';
import { AppComponent } from './components/app/app.component';
import { UpdateNotificationComponent } from './components/update-notification/update-notification.component';
import { NzNotificationModule } from 'ng-zorro-antd/notification';


registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    NzNotificationModule,
    UpdateNotificationComponent,

    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,

    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      useHash: true,
    }),
  ],
  providers: [
    {
      provide: NZ_I18N,
      useValue: en_US,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
