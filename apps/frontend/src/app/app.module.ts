import { ObserversModule } from '@angular/cdk/observers';
import { registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import en from '@angular/common/locales/en';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TeleportModule } from '@ngneat/overview';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { en_US, NZ_I18N } from 'ng-zorro-antd/i18n';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { routes } from './app.routing';
import { WINDOW } from './components/app.const';

import { AppComponent } from './components/app/app.component';
import { ChannelEditModalComponent } from './components/channel-edit-modal/channel-edit-modal.component';
import { LogEntryComponent } from './components/log-entry/log-entry.component';
import { LogMinimapComponent } from './components/log-minimap/log-minimap.component';
import { LogComponent } from './components/log/log.component';
import { AnsiPipe } from './components/pipes/ansi.pipe';
import { iconProvider } from './providers/icon.provider';
import { storageProvider } from './stores/store.provider';

registerLocaleData(en);


@NgModule({
  declarations: [
    AppComponent,
    LogComponent,
    LogMinimapComponent,
    ChannelEditModalComponent,
    LogEntryComponent,
    AnsiPipe,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NzCheckboxModule,
    NzDropDownModule,
    NzIconModule,
    NzInputModule,
    NzFormModule,
    NzLayoutModule,
    NzMenuModule,
    NzModalModule,
    NzButtonModule,
    NzPopconfirmModule,
    FontAwesomeModule,
    FlexLayoutModule,
    ObserversModule,
    TeleportModule,

    RouterModule.forRoot(routes, { initialNavigation: 'enabled', useHash: true }),
  ],
  providers: [
    iconProvider,
    storageProvider,

    {
      provide: NZ_I18N,
      useValue: en_US,
    },
    {
      provide: WINDOW,
      useValue: window,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
