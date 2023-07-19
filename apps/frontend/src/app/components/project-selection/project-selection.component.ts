import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { uuidV4 } from '@dev-console/helpers';
import { Project } from '@dev-console/types';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Observable, switchMap } from 'rxjs';
import { ProjectRepository } from '../../stores/project.repository';
import { Title } from '@angular/platform-browser';
import { windowListenAsObservable } from '../../helpers/tauri.helper';
import { TauriEvent } from '@tauri-apps/api/event';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { exit } from '@tauri-apps/api/process';

@Component({
  selector: 'dc-project-selection',
  templateUrl: './project-selection.component.html',
  styleUrls: ['./project-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSelectionComponent implements OnInit {

  protected readonly fasEdit = faEdit;
  protected readonly fasTrash = faTrash;
  protected readonly farQuestionCircle = faQuestionCircle;

  projects$: Observable<Project[]>;

  constructor(
    private readonly titleService: Title,
    private readonly projectRepository: ProjectRepository,
    private readonly router: Router,
  ) {
    this.projects$ = this.projectRepository.projects$;
    windowListenAsObservable(TauriEvent.WINDOW_CLOSE_REQUESTED)
      .pipe(
        takeUntilDestroyed(),
        switchMap(() => exit(0)),
      )
      .subscribe();
  }

  ngOnInit() {
    this.titleService.setTitle('DevConsole');
  }

  async openProject(project: Project) {
    console.log('OPEN', project);
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
