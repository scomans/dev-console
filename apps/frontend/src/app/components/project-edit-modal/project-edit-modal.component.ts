import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
import { FormGroup as AngularFormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project } from '@dev-console/types';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { open } from '@tauri-apps/api/dialog';
import { isNil } from 'lodash';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { RxPush } from '@rx-angular/template/push';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'dc-project-edit-modal',
  templateUrl: './project-edit-modal.component.html',
  styleUrls: ['./project-edit-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FontAwesomeModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzModalModule,
    ReactiveFormsModule,
    RxPush,
  ],
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
  isVisible = signal(false);

  @Output() dcResult = new EventEmitter<Project>();

  done() {
    this.dcResult.emit(this.form.value);
    this.hide();
  }

  hide() {
    this.isVisible.update(() => false);
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
    this.isVisible.update(() => true);
  }

}
