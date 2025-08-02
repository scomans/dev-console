import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Project } from '@dev-console/types';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { switchMap } from 'rxjs';
import { ProjectStore } from '../../stores/project.store';
import { Title } from '@angular/platform-browser';
import { windowListenAsObservable } from '../../helpers/tauri.helper';
import { TauriEvent } from '@tauri-apps/api/event';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { exit } from '@tauri-apps/api/process';
import { NzContentComponent, NzHeaderComponent, NzLayoutComponent } from 'ng-zorro-antd/layout';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzCardComponent, NzCardMetaComponent } from 'ng-zorro-antd/card';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { SmartTrimPipe } from '../../pipes/smart-trim.pipe';
import { NzPopconfirmDirective } from 'ng-zorro-antd/popconfirm';
import { ProjectEditModalComponent } from '../project-edit-modal/project-edit-modal.component';
import { NgOptimizedImage } from '@angular/common';
import { AboutModalComponent } from '../about-modal/about-modal.component';
import { v4 } from 'uuid';

@Component({
  selector: 'dc-project-selection',
  templateUrl: './project-selection.component.html',
  styleUrl: './project-selection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AboutModalComponent,
    FaIconComponent,
    NgOptimizedImage,
    NzButtonComponent,
    NzCardComponent,
    NzCardMetaComponent,
    NzContentComponent,
    NzHeaderComponent,
    NzLayoutComponent,
    NzPopconfirmDirective,
    NzTooltipDirective,
    ProjectEditModalComponent,
    SmartTrimPipe,
  ],
})
export class ProjectSelectionComponent implements OnInit {
  private readonly titleService = inject(Title);
  private readonly projectStore = inject(ProjectStore);
  private readonly router = inject(Router);
  /* ### ICONS ### */
  protected readonly fasEdit = faEdit;
  protected readonly fasTrash = faTrash;
  protected readonly farQuestionCircle = faQuestionCircle;

  projects = this.projectStore.entities;

  constructor() {
    windowListenAsObservable(TauriEvent.WINDOW_CLOSE_REQUESTED)
      .pipe(
        switchMap(async () => {
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

  async upsertProject(project: Project) {
    if (project.id) {
      this.projectStore.updateProject(project.id, project);
    } else {
      this.projectStore.addProject({ ...project, id: v4() });
    }
    await this.projectStore.persistProjects();
  }

  async removeProject(project: Project) {
    this.projectStore.removeProject(project.id);
    await this.projectStore.persistProjects();
  }
}
