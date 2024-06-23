import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { FormGroup as AngularFormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { isEmpty } from '@dev-console/helpers';
import { Channel } from '@dev-console/types';
import { faFolderOpen, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { parse as parseEnv, stringify as stringifyEnv } from 'envfile';
import { open } from '@tauri-apps/api/dialog';
import { isNil } from 'es-toolkit';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzColorPickerModule } from 'ng-zorro-antd/color-picker';
import { isFormInvalid } from '../../helpers/form.helper';

@Component({
  selector: 'dc-channel-edit-modal',
  templateUrl: './channel-edit-modal.component.html',
  styleUrl: './channel-edit-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FaIconComponent,
    NzButtonModule,
    NzCheckboxModule,
    NzColorPickerModule,
    NzFormModule,
    NzInputModule,
    NzModalModule,
    NzPopoverModule,
    ReactiveFormsModule,
  ],
})
export class ChannelEditModalComponent {
  protected readonly fasFolderOpen = faFolderOpen;
  protected readonly fasInfoCircle = faInfoCircle;

  protected readonly isVisible = signal(false);
  protected readonly channel = signal<Channel | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl<string>(null, Validators.required),
    color: new FormControl<string>('#ffffff', { validators: [Validators.required], nonNullable: true }),
    executeIn: new FormControl<string>(),
    executable: new FormControl<string>(null, Validators.required),
    envFile: new FormControl<string>(),
    envVars: new FormControl<string>(),
    arguments: new FormControl<string>(),
    active: new FormControl(true, { validators: [Validators.required], nonNullable: true }),
    regex: new FormGroup({
      search: new FormControl<string>(),
      replace: new FormControl<string>(),
    }),
    waitOn: new FormControl<string>(),
  });
  protected readonly angularForm: AngularFormGroup = this.form;
  protected readonly isFormInvalid = isFormInvalid(this.form);

  dcResult = output<Omit<Channel, 'index'>>();

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
    this.channel.set(null);
    this.isVisible.set(false);
  }

  show(channel?: Channel) {
    this.channel.set(channel ?? null);
    if (channel) {
      this.form.patchValue({
        ...channel,
        color: channel.color ?? '#ffffff',
        arguments: channel.arguments?.join('\n') ?? null,
        waitOn: channel.waitOn?.join('\n') ?? null,
        envVars: channel.envVars ? stringifyEnv(channel.envVars) : null,
      });
    }
    this.isVisible.set(true);
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
