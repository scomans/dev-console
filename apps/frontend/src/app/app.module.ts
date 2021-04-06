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
import { LetModule } from '@rx-angular/template';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ColorSliderModule } from 'ngx-color/slider';
import { routes } from './app.routing';
import { WINDOW } from './components/app.const';

import { AppComponent } from './components/app/app.component';
import { ChannelEditModalComponent } from './components/channel-edit-modal/channel-edit-modal.component';
import { ColorSliderComponent } from './components/color-slider/color-slider.component';
import { LogEntryComponent } from './components/log-entry/log-entry.component';
import { LogMinimapComponent } from './components/log-minimap/log-minimap.component';
import { LogComponent } from './components/log/log.component';
import { ProjectEditModalComponent } from './components/project-edit-modal/project-edit-modal.component';
import { ProjectSelectionComponent } from './components/project-selection/project-selection.component';
import { ProjectComponent } from './components/project/project.component';
import { AnsiPipe } from './pipes/ansi.pipe';
import { SmartTrimPipe } from './pipes/smart-trim.pipe';
import { iconProvider } from './providers/icon.provider';

registerLocaleData(en);


@NgModule({
  declarations: [
    AppComponent,
    LogComponent,
    LogMinimapComponent,
    ChannelEditModalComponent,
    LogEntryComponent,
    AnsiPipe,
    ProjectComponent,
    ProjectEditModalComponent,
    ProjectSelectionComponent,
    SmartTrimPipe,
    ColorSliderComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NzCardModule,
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
    NzToolTipModule,
    FontAwesomeModule,
    FlexLayoutModule,
    ObserversModule,
    TeleportModule,
    LetModule,
    ColorSliderModule,

    RouterModule.forRoot(routes, { initialNavigation: 'enabled', useHash: true }),
  ],
  providers: [
    iconProvider,
    // storageProvider,

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
