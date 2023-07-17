import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgOptimizedImage, registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import en from '@angular/common/locales/en';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RxFor } from '@rx-angular/template/for';
import { RxLet } from '@rx-angular/template/let';
import { RxPush } from '@rx-angular/template/push';
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
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ColorSliderModule } from 'ngx-color/slider';
import { routes } from './app.routing';
import { AppComponent } from './components/app/app.component';
import { ChannelEditModalComponent } from './components/channel-edit-modal/channel-edit-modal.component';
import { ChannelLogComponent } from './components/channel-log/channel-log.component';
import { ChannelOrderModalComponent } from './components/channel-order-modal/channel-order-modal.component';
import { ColorSliderComponent } from './components/color-slider/color-slider.component';
import { CombinedLogComponent } from './components/combined-log/combined-log.component';
import { LogEntryComponent } from './components/log-entry/log-entry.component';
import { LogViewerComponent } from './components/log-viewer/log-viewer.component';
import { ProjectEditModalComponent } from './components/project-edit-modal/project-edit-modal.component';
import { ProjectSelectionComponent } from './components/project-selection/project-selection.component';
import { ProjectComponent } from './components/project/project.component';
import { AutoScrollDirective } from './directives/auto-scroll.directive';
import { AnsiPipe } from './pipes/ansi.pipe';
import { AutolinkPipe } from './pipes/autolink.pipe';
import { SafePipe } from './pipes/safe.pipe';
import { SmartTrimPipe } from './pipes/smart-trim.pipe';
import { RxIf } from '@rx-angular/template/if';
import { UpdateNotificationComponent } from './components/update-notification/update-notification.component';
import { NzNotificationModule } from 'ng-zorro-antd/notification';


registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    ChannelLogComponent,
    CombinedLogComponent,
    ChannelEditModalComponent,
    LogEntryComponent,
    AnsiPipe,
    ProjectComponent,
    ProjectEditModalComponent,
    ProjectSelectionComponent,
    SmartTrimPipe,
    ColorSliderComponent,
    AutoScrollDirective,
    LogViewerComponent,
    AutolinkPipe,
    SafePipe,
    ChannelOrderModalComponent,
  ],
  imports: [
    NzNotificationModule,

    BrowserModule,
    DragDropModule,
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
    NzPopoverModule,
    NzSelectModule,
    NzSpinModule,
    NzSwitchModule,
    NzToolTipModule,
    FontAwesomeModule,
    RxFor,
    RxLet,
    RxPush,
    RxIf,
    ColorSliderModule,

    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      useHash: true,
    }),
    NgOptimizedImage,
    UpdateNotificationComponent,
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
