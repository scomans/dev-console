import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
import { FormGroup as AngularFormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { isEmpty } from '@dev-console/helpers';
import { Channel } from '@dev-console/types';
import { faFolderOpen, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { parse as parseEnv, stringify as stringifyEnv } from 'envfile';
import { open } from '@tauri-apps/api/dialog';
import { isNil } from 'lodash-es';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { RxPush } from '@rx-angular/template/push';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzColorPickerModule } from 'ng-zorro-antd/color-picker';

@Component({
  selector: 'dc-channel-edit-modal',
  templateUrl: './channel-edit-modal.component.html',
  styleUrls: ['./channel-edit-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FontAwesomeModule,
    NzButtonModule,
    NzCheckboxModule,
    NzColorPickerModule,
    NzFormModule,
    NzInputModule,
    NzModalModule,
    NzPopoverModule,
    ReactiveFormsModule,
    RxPush,
  ],
})
export class ChannelEditModalComponent {

  readonly fasFolderOpen = faFolderOpen;
  readonly fasInfoCircle = faInfoCircle;

  isVisible = signal(false);
  channel = signal<Channel | null>(null);

  form = new FormGroup({
    name: new FormControl<string>(null, Validators.required),
    color: new FormControl<string>('#ffffff', Validators.required),
    executeIn: new FormControl<string>(),
    executable: new FormControl<string>(null, Validators.required),
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
  angularForm: AngularFormGroup = this.form;

  @Output() dcResult = new EventEmitter<Omit<Channel, 'index'>>();

  done() {
    const data = this.form.getRawValue();
    const channel: Omit<Channel, 'index'> = {
      ...data,
      id: this.channel()?.id,
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
    this.angularForm.reset({
      color: '#ffffff',
    });
    this.channel.update(() => null);
    this.isVisible.update(() => false);
  }

  show(channel?: Channel) {
    this.channel.update(() => channel ?? null);
    if (channel) {
      this.form.patchValue({
        ...channel,
        color: channel.color ?? '#ffffff',
        arguments: channel.arguments?.join('\n') ?? null,
        waitOn: channel.waitOn?.join('\n') ?? null,
        envVars: channel.envVars ? stringifyEnv(channel.envVars) : null,
      });
    }
    this.isVisible.update(() => true);
  }

  async selectCwd() {
    const file = await open({ directory: true }) as string;
    if (!isNil(file)) {
      this.form.patchValue({ executeIn: file });
    }
  }

  async selectExecutable() {
    const file = await open() as string;
    if (!isNil(file)) {
      this.form.patchValue({
        executable: file,
      });
    }
  }

  async selectEnvFile() {
    const file = await open() as string;
    if (!isNil(file)) {
      this.form.patchValue({
        envFile: file,
      });
    }
  }

}
