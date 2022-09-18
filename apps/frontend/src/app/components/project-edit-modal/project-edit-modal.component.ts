import { Component, EventEmitter, Output } from '@angular/core';
import { FormGroup as AngularFormGroup, Validators } from '@angular/forms';
import { Project } from '@dev-console/types';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { BehaviorSubject } from 'rxjs';
import { ElectronService } from '../../services/electron.service';


@Component({
  selector: 'dc-project-edit-modal',
  templateUrl: './project-edit-modal.component.html',
  styleUrls: ['./project-edit-modal.component.scss'],
})
export class ProjectEditModalComponent {

  readonly fasFolderOpen = faFolderOpen;

  validateForm = new FormGroup({
    name: new FormControl(null, Validators.required),
    file: new FormControl(null, Validators.required),
  });
  form: AngularFormGroup = this.validateForm;

  project = new BehaviorSubject<Project>(undefined);
  isVisible = new BehaviorSubject(false);

  @Output('dcResult') resultEmitter = new EventEmitter<Project>();

  constructor(
    private readonly electronService: ElectronService,
  ) {
  }

  done() {
    const project: Project = {
      id: this.project.getValue()?.id,
      ...this.validateForm.getRawValue(),
    };
    this.resultEmitter.emit(project);
    this.hide();
  }

  hide() {
    this.isVisible.next(false);
    this.project.next(undefined);
    this.validateForm.reset();
  }

  async selectFile() {
    const file = await this.electronService.showOpenDialog({
      properties: ['openFile', 'promptToCreate', 'dontAddToRecent'],
      filters: [
        {
          name: 'DevConsole project file',
          extensions: ['json'],
        },
      ],
    });
    if (!file.canceled) {
      this.validateForm.patchValue({
        file: file.filePaths[0],
      });
    }
  }

  show(project?: Project) {
    this.project.next(project);
    if (project) {
      this.validateForm.patchValue({
        file: project.file,
        name: project.name,
      });
    }
    this.isVisible.next(true);
  }

}
