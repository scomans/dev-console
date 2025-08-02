import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { NzModalComponent, NzModalContentDirective } from 'ng-zorro-antd/modal';
import { NzResultComponent } from 'ng-zorro-antd/result';


@Component({
  selector: 'dc-exit-modal',
  templateUrl: './exit-modal.component.html',
  styleUrl: './exit-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FaIconComponent,
    NzModalComponent,
    NzModalContentDirective,
    NzResultComponent,
  ],
})
export class ExitModalComponent {

  /* ### ICONS ### */
  protected readonly fasGear = faGear;

  /* ### COMPONENT ### */
  protected readonly isVisible = signal(false);
  public readonly visible = this.isVisible.asReadonly();

  /* ### METHODS ### */

  show() {
    this.isVisible.set(true);
  }

}
