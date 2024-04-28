import { ChangeDetectionStrategy, Component, OnInit, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { uuidV4 } from '@dev-console/helpers';
import { Project } from '@dev-console/types';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { switchMap } from 'rxjs';
import { ProjectRepository } from '../../stores/project.repository';
import { Title } from '@angular/platform-browser';
import { windowListenAsObservable } from '../../helpers/tauri.helper';
import { TauriEvent } from '@tauri-apps/api/event';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { exit } from '@tauri-apps/api/process';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { SmartTrimPipe } from '../../pipes/smart-trim.pipe';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { ProjectEditModalComponent } from '../project-edit-modal/project-edit-modal.component';
import { NgOptimizedImage } from '@angular/common';
import { AboutModalComponent } from '../about-modal/about-modal.component';
import { saveWindowState, StateFlags } from 'tauri-plugin-window-state-api';

@Component({
  selector: 'dc-project-selection',
  templateUrl: './project-selection.component.html',
  styleUrls: ['./project-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AboutModalComponent,
    FaIconComponent,
    NgOptimizedImage,
    NzButtonModule,
    NzCardModule,
    NzLayoutModule,
    NzPopconfirmModule,
    NzToolTipModule,
    ProjectEditModalComponent,
    SmartTrimPipe,
  ],
})
export class ProjectSelectionComponent implements OnInit {

  protected readonly fasEdit = faEdit;
  protected readonly fasTrash = faTrash;
  protected readonly farQuestionCircle = faQuestionCircle;

  projects: Signal<Project[]>;

  constructor(
    private readonly titleService: Title,
    private readonly projectRepository: ProjectRepository,
    private readonly router: Router,
  ) {
    this.projects = toSignal(this.projectRepository.projects$, { initialValue: [] });
    windowListenAsObservable(TauriEvent.WINDOW_CLOSE_REQUESTED)
      .pipe(
        switchMap(async () => {
          await saveWindowState(StateFlags.SIZE + StateFlags.POSITION + StateFlags.MAXIMIZED);
          await exit(0);
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  ngOnInit() {
    this.titleService.setTitle('DevConsole');
  }

  async openProject(project: Project) {
    await this.router.navigate(['/project'], { queryParams: { projectId: project.id } });
  }

  upsertProject(project: Project) {
    if (project.id) {
      this.projectRepository.updateProject(project.id, project);
    } else {
      this.projectRepository.addProject({ ...project, id: uuidV4() });
    }
  }

  removeProject(project: Project) {
    this.projectRepository.removeProject(project.id);
  }

}
