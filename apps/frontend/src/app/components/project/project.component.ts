import { Component, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filterNil, uuidV4 } from '@dev-console/helpers';
import { Channel, ExecuteStatus, Project } from '@dev-console/types';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { ElectronService } from '../../services/electron.service';
import { ExecuteService } from '../../services/execute.service';
import { GlobalStoreService } from '../../stores/global-store.service';
import { ProjectStoreService } from '../../stores/project-store.service';
import { ChannelEditModalComponent } from '../channel-edit-modal/channel-edit-modal.component';

@Component({
  selector: 'cl-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
})
export class ProjectComponent {

  ExecuteStatus = ExecuteStatus;
  subs = new SubSink();

  channels$: Observable<Channel[]>;
  selectedChannelId$: Observable<string>;
  project$: Observable<Project>;
  allLogs$: Observable<boolean>;
  sidebarCollapsed$ = this.projectStore.ui.query.select('sidebarCollapsed');

  constructor(
    private readonly electronService: ElectronService,
    private readonly globalStore: GlobalStoreService,
    private readonly projectStore: ProjectStoreService,
    private readonly route: ActivatedRoute,
    private readonly modal: NzModalService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly executeService: ExecuteService,
  ) {
    this.project$ = this.route.params.pipe(
      map(params => params.projectId),
      switchMap(id => this.globalStore.projects.query.selectEntity(id)),
      filterNil(),
      tap(project => {
        document.title = `${project.name} - DevConsole`;
        void this.projectStore.openProject(project);
      }),
    );
    this.selectedChannelId$ = this.projectStore.channel.query.selectActiveId();
    this.allLogs$ = this.selectedChannelId$.pipe(
      map(activeId => !activeId),
    );
    this.channels$ = this.projectStore.channel.query.selectAll();
  }

  toggleSidebar() {
    this.projectStore.ui.service.toggleSidebar();
  }

  openChannel(id: string) {
    this.projectStore.channel.service.setActive(id);
  }

  newChannel() {
    const modal = this.modal.create({
      nzTitle: 'New channel',
      nzContent: ChannelEditModalComponent,
      nzViewContainerRef: this.viewContainerRef,
      nzFooter: [
        {
          label: 'Cancel',
          onClick: () => modal.triggerCancel(),
        },
        {
          label: 'Done',
          type: 'primary',
          onClick: componentInstance => componentInstance!.done(),
        },
      ],
    });

    modal.afterClose.subscribe(result => {
      if (result) {
        this.projectStore.channel.service.add({
          id: uuidV4(),
          ...result,
        });
      }
    });
  }

  channelStatus(channelId: string) {
    return this.executeService.selectStatus(channelId);
  }
}
