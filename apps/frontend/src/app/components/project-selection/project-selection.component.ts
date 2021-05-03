import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { uuidV4 } from '@dev-console/helpers';
import { Project } from '@dev-console/types';
import { Observable } from 'rxjs';
import { GlobalStoreService } from '../../stores/global-store.service';

@Component({
  selector: 'cl-project-selection',
  templateUrl: './project-selection.component.html',
  styleUrls: ['./project-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSelectionComponent implements OnInit {

  projects$: Observable<Project[]>;

  constructor(
    private readonly globalStoreService: GlobalStoreService,
    private readonly router: Router,
  ) {
    this.projects$ = this.globalStoreService.projects.query.selectAll();
  }

  ngOnInit() {
    document.title = 'DevConsole';
  }

  openProject(project: Project) {
    void this.router.navigate(['project', project.id]);
  }

  editProject(project: Project) {
    this.globalStoreService.projects.service.update(project.id, project);
  }

  addProject(project: Project) {
    this.globalStoreService.projects.service.add({ id: uuidV4(), ...project });
  }

  removeProject(project: Project) {
    this.globalStoreService.projects.service.remove(project.id);
  }
}
