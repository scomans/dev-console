import { Component, EventEmitter, Output } from '@angular/core';
import { FormGroup as AngularFormGroup, Validators } from '@angular/forms';
import { isEmpty } from '@dev-console/helpers';
import { Channel } from '@dev-console/types';
import { faCircle, faFolderOpen, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { parse as parseEnv, stringify as stringifyEnv } from 'envfile';
import { BehaviorSubject } from 'rxjs';
import { SetOptional } from 'type-fest';
import { ElectronService } from '../../services/electron.service';


@Component({
  selector: 'dc-channel-edit-modal',
  templateUrl: './channel-edit-modal.component.html',
  styleUrls: ['./channel-edit-modal.component.scss'],
})
export class ChannelEditModalComponent {

  readonly fasCircle = faCircle;
  readonly fasFolderOpen = faFolderOpen;
  readonly fasInfoCircle = faInfoCircle;

  isVisible = new BehaviorSubject(false);
  channel = new BehaviorSubject<Channel | null>(null);

  validateForm = new FormGroup({
    name: new FormControl<string>(null, Validators.required),
    color: new FormControl<string>('#ffffff', Validators.required),
    executeIn: new FormControl<string>(),
    executable: new FormControl<string>(null, Validators.required),
    stopSignal: new FormControl('SIGTERM', Validators.required),
    envFile: new FormControl<string>(),
    envVars: new FormControl<string>(),
    arguments: new FormControl<string>(),
    active: new FormControl(true, Validators.required),
    regex: new FormGroup({
      search: new FormControl<string>(),
      replace: new FormControl<string>(),
    }),
    waitOn: new FormControl<string>(),
  });
  form: AngularFormGroup = this.validateForm;

  @Output() dcResult = new EventEmitter<SetOptional<Omit<Channel, 'index'>, 'id'>>();

  constructor(
    private readonly electronService: ElectronService,
  ) {
  }

  done() {
    const data = this.validateForm.getRawValue();
    const channel: SetOptional<Omit<Channel, 'index'>, 'id'> = {
      ...data,
      arguments: isEmpty(data.arguments) ? null : data.arguments.split('\n'),
      waitOn: isEmpty(data.waitOn) ? null : data.waitOn.split('\n'),
      envVars: isEmpty(data.envVars) ? null : parseEnv(data.envVars),
      executeIn: isEmpty(data.executeIn) ? null : data.executeIn,
      envFile: isEmpty(data.envFile) ? null : data.envFile,
      regex: {
        search: isEmpty(data.regex.search) ? null : data.regex.search,
        replace: isEmpty(data.regex.replace) ? null : data.regex.replace,
      },
    };
    this.dcResult.emit(channel);
    this.hide();
  }

  hide() {
    this.form.reset({
      color: '#ffffff',
    });
    this.channel.next(null);
    this.isVisible.next(false);
  }

  show(channel?: Channel) {
    this.channel.next(channel ?? null);
    if (channel) {
      this.validateForm.patchValue({
        ...channel,
        color: channel.color ?? '#ffffff',
        arguments: channel.arguments.join('\n'),
        waitOn: channel.waitOn.join('\n'),
        envVars: channel.envVars ? stringifyEnv(channel.envVars) : null,
      });
    }
    this.isVisible.next(true);
  }

  async selectCwd() {
    const file = await this.electronService.showOpenDialog({
      properties: ['openDirectory', 'promptToCreate', 'dontAddToRecent'],
    });
    if (!file.canceled) {
      this.validateForm.patchValue({
        executeIn: file.filePaths[0],
      });
    }
  }

  async selectExecutable() {
    const file = await this.electronService.showOpenDialog({
      properties: ['openFile', 'dontAddToRecent'],
    });
    if (!file.canceled) {
      this.validateForm.patchValue({
        executable: file.filePaths[0],
      });
    }
  }

  async selectEnvFile() {
    const file = await this.electronService.showOpenDialog({
      properties: ['openFile', 'dontAddToRecent'],
    });
    if (!file.canceled) {
      this.validateForm.patchValue({
        envFile: file.filePaths[0],
      });
    }
  }

}
