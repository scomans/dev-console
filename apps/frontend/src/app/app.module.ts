import { ObserversModule } from '@angular/cdk/observers';
import { registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import en from '@angular/common/locales/en';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { en_US, NZ_I18N } from 'ng-zorro-antd/i18n';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { routes } from './app.routing';
import { WINDOW } from './components/app.const';

import { AppComponent } from './components/app/app.component';
import { LogMinimapComponent } from './components/log-minimap/log-minimap.component';
import { LogComponent } from './components/log/log.component';
import { iconProvider } from './providers/icon.provider';

registerLocaleData(en);


@NgModule({
  declarations: [
    AppComponent,
    LogComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzButtonModule,
    FontAwesomeModule,
    FlexLayoutModule,

    RouterModule.forRoot(routes, { initialNavigation: 'enabled', useHash: true }),
  ],
  providers: [
    iconProvider,

    {
      provide: NZ_I18N,
      useValue: en_US,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
