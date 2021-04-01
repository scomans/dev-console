import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Channel } from '../../stores/channel/channel.model';

@Component({
  selector: 'cl-channel-edit-modal',
  templateUrl: './channel-edit-modal.component.html',
  styleUrls: ['./channel-edit-modal.component.scss'],
})
export class ChannelEditModalComponent implements OnInit {

  validateForm!: FormGroup;

  @Input() channel?: Channel;

  constructor(
    private readonly modal: NzModalRef,
    private readonly fb: FormBuilder,
  ) {
  }

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      name: [this.channel?.name, [Validators.required]],
      executeIn: [this.channel?.executeIn],
      executable: [this.channel?.executable, [Validators.required]],
      arguments: [this.channel?.arguments?.join('\n')],
      active: [this.channel?.active, [Validators.required]],
      regex: this.fb.group({
        prefix: [this.channel?.regex?.prefix],
        suffix: [this.channel?.regex?.suffix],
      }),
    });
  }

  done() {
    const channel = this.validateForm.getRawValue();
    if (channel.arguments) {
      channel.arguments = channel.arguments.split('\n');
    } else {
      channel.arguments = null;
    }
    console.log(channel);
    this.modal.close(channel);
  }
}
