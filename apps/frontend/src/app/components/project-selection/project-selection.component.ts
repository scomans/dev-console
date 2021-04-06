import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { GlobalStoreService } from '../../stores/global-store.service';
import { Project } from '../../stores/project/project.model';

@Component({
  selector: 'cl-project-selection',
  templateUrl: './project-selection.component.html',
  styleUrls: ['./project-selection.component.scss'],
})
export class ProjectSelectionComponent {

  projects$: Observable<Project[]>;

  constructor(
    private readonly globalStoreService: GlobalStoreService,
    private readonly router: Router,
  ) {
    this.projects$ = this.globalStoreService.projects.query.selectAll();
  }

  openProject(project: Project) {
    void this.router.navigate(['project', project.id]);
  }

  editProject(project: Project) {

  }
}
