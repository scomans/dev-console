import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormGroup as AngularFormGroup, Validators } from '@angular/forms';
import { Project } from '@dev-console/types';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { BehaviorSubject } from 'rxjs';
import { open } from '@tauri-apps/api/dialog';
import { isNil } from 'lodash';

@Component({
  selector: 'dc-project-edit-modal',
  templateUrl: './project-edit-modal.component.html',
  styleUrls: ['./project-edit-modal.component.scss'],
})
export class ProjectEditModalComponent {

  readonly fasFolderOpen = faFolderOpen;

  form = new FormGroup({
    id: new FormControl(null),
    name: new FormControl(null, Validators.required),
    file: new FormControl(null, Validators.required),
  });
  angularForm: AngularFormGroup = this.form;

  project = signal<undefined | string>(undefined);
  isVisible = new BehaviorSubject(false);

  @Output('dcResult') resultEmitter = new EventEmitter<Project>();

  done() {
    this.resultEmitter.emit(this.form.value);
    this.hide();
  }

  hide() {
    this.isVisible.next(false);
    this.project.update(() => undefined);
    this.form.reset();
  }

  async selectFile() {
    const file = await open({
      filters: [{
        name: 'DevConsole project file',
        extensions: ['json'],
      }],
    }) as string;
    if (!isNil(file)) {
      this.form.patchValue({
        file: file,
      });
    }
  }

  show(project?: Project) {
    if (project) {
      this.form.patchValue({
        id: project.id,
        file: project.file,
        name: project.name,
      });
    }
    this.isVisible.next(true);
  }

}
