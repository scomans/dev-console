import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Project } from '@dev-console/types';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'cl-project-edit-modal',
  templateUrl: './project-edit-modal.component.html',
  styleUrls: ['./project-edit-modal.component.scss'],
})
export class ProjectEditModalComponent implements OnInit {

  validateForm!: FormGroup;

  @Input() project?: Project;
  @Input() isVisible: boolean = false;

  @Output('result') resultEmitter = new EventEmitter<Project>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly electronService: ElectronService,
  ) {
  }

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      name: [this.project?.name, [Validators.required]],
      file: [this.project?.file, [Validators.required]],
    });
  }

  done() {
    const project = {
      ...(this.project ?? {}),
      ...this.validateForm.getRawValue(),
    };
    this.isVisible = false;
    this.resultEmitter.emit(project);
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  async selectFile() {
    const file = await this.electronService.dialog.showOpenDialog({
      properties: ['openFile', 'promptToCreate', 'dontAddToRecent'],
      filters: [{
        name: 'DevConsole project file',
        extensions: ['json'],
      }],
    });
    if (!file.canceled) {
      this.validateForm.patchValue({
        file: file.filePaths[0],
      });
    }
  }

  show() {
    this.isVisible = true;
  }
}
