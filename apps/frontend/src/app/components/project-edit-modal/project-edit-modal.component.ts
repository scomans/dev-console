import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
import { FormGroup as AngularFormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project } from '@dev-console/types';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { save } from '@tauri-apps/api/dialog';
import { isNil } from 'lodash-es';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { isFormInvalid } from '../../helpers/form.helper';

@Component({
  selector: 'dc-project-edit-modal',
  templateUrl: './project-edit-modal.component.html',
  styleUrl: './project-edit-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FaIconComponent,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzModalModule,
    ReactiveFormsModule,
  ],
})
export class ProjectEditModalComponent {

  protected readonly fasFolderOpen = faFolderOpen;

  protected readonly project = signal<undefined | string>(undefined);
  protected readonly isVisible = signal(false);

  protected readonly form = new FormGroup({
    id: new FormControl(null),
    name: new FormControl(null, Validators.required),
    file: new FormControl(null, Validators.required),
  });
  protected readonly angularForm: AngularFormGroup = this.form;
  protected readonly isFormInvalid = isFormInvalid(this.form);

  @Output() dcResult = new EventEmitter<Project>();

  done() {
    this.dcResult.emit(this.form.value);
    this.hide();
  }

  hide() {
    this.isVisible.set(false);
    this.project.set(undefined);
    this.form.reset();
  }

  async selectFile() {
    const file = await save({
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
    this.isVisible.set(true);
  }

}
