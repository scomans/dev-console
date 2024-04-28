import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzResultModule } from 'ng-zorro-antd/result';


@Component({
  selector: 'dc-exit-modal',
  templateUrl: './exit-modal.component.html',
  styleUrls: ['./exit-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FaIconComponent,
    NzButtonModule,
    NzModalModule,
    NzResultModule,
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
    this.isVisible.update(() => true);
  }

}
