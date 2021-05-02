import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { isEmpty } from '@dev-console/helpers';
import { Channel } from '@dev-console/types';
import { parse as parseEnv, stringify as stringifyEnv } from 'envfile';
import { get, set } from 'lodash';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { ElectronService } from '../../services/electron.service';

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
    private readonly electronService: ElectronService,
  ) {
  }

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      name: [this.channel?.name, [Validators.required]],
      color: [this.channel?.color ?? '#ffffff', [Validators.required]],
      executeIn: [this.channel?.executeIn],
      executable: [this.channel?.executable, [Validators.required]],
      envFile: [this.channel?.envFile],
      envVars: [this.channel?.envVars ? stringifyEnv(this.channel.envVars) : undefined],
      arguments: [this.channel?.arguments?.join('\n')],
      active: [this.channel?.active, [Validators.required]],
      regex: this.fb.group({
        search: [this.channel?.regex?.search],
        replace: [this.channel?.regex?.replace],
      }),
      waitOn: [this.channel?.waitOn?.join('\n')],
    });
  }

  done() {
    const channel = this.validateForm.getRawValue();
    if (!isEmpty(channel.arguments)) {
      channel.arguments = channel.arguments.split('\n');
    } else {
      channel.arguments = null;
    }
    if (!isEmpty(channel.waitOn)) {
      channel.waitOn = channel.waitOn.split('\n');
    } else {
      channel.waitOn = null;
    }
    if (!isEmpty(channel.envVars)) {
      channel.envVars = parseEnv(channel.envVars);
    } else {
      channel.envVars = null;
    }
    ['executeIn', 'envFile', 'regex.search', 'regex.replace'].forEach(field => {
      const value = get(channel, field);
      if (isEmpty(value)) {
        set(channel, field, null);
      }
    });
    this.modal.close(channel);
  }

  async selectCwd() {
    const file = await this.electronService.dialog.showOpenDialog({
      properties: ['openDirectory', 'promptToCreate', 'dontAddToRecent'],
    });
    if (!file.canceled) {
      this.validateForm.patchValue({
        executeIn: file.filePaths[0],
      });
    }
  }

  async selectExecutable() {
    const file = await this.electronService.dialog.showOpenDialog({
      properties: ['openFile', 'dontAddToRecent'],
    });
    if (!file.canceled) {
      this.validateForm.patchValue({
        executable: file.filePaths[0],
      });
    }
  }

  async selectEnvFile() {
    const file = await this.electronService.dialog.showOpenDialog({
      properties: ['openFile', 'dontAddToRecent'],
    });
    if (!file.canceled) {
      this.validateForm.patchValue({
        envFile: file.filePaths[0],
      });
    }
  }
}
