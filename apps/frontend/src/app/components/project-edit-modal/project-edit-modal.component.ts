import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Project } from '../../stores/project/project.model';

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

  show() {
    this.isVisible = true;
  }
}
