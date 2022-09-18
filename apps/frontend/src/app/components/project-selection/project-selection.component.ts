import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { uuidV4 } from '@dev-console/helpers';
import { Project } from '@dev-console/types';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';
import { ProjectRepository } from '../../stores/project.repository';


@Component({
  selector: 'dc-project-selection',
  templateUrl: './project-selection.component.html',
  styleUrls: ['./project-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSelectionComponent implements OnInit {

  readonly fasEdit = faEdit;
  readonly fasTrash = faTrash;
  readonly farQuestionCircle = faQuestionCircle;

  projects$: Observable<Project[]>;

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly router: Router,
  ) {
    this.projects$ = this.projectRepository.projects$;
  }

  ngOnInit() {
    this.projectRepository.setProjectActive(null);
    document.title = 'DevConsole';
  }

  openProject(project: Project) {
    this.projectRepository.setProjectActive(project.id);
    void this.router.navigate(['project']);
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
