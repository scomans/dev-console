import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { Channel } from '@dev-console/types';
import { faGripLines } from '@fortawesome/free-solid-svg-icons';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NzButtonModule } from 'ng-zorro-antd/button';


@Component({
  selector: 'dc-channel-order-modal',
  templateUrl: './channel-order-modal.component.html',
  styleUrl: './channel-order-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    FaIconComponent,
    NzButtonModule,
    NzModalModule,
  ],
})
export class ChannelOrderModalComponent {
  protected readonly fasGripLines = faGripLines;

  protected readonly channels = signal<Channel[]>([]);
  protected readonly isVisible = signal(false);

  public readonly dcResult = output<{ id: string, index: number }[]>();

  drop(event: CdkDragDrop<string[]>) {
    const channels = this.channels();
    moveItemInArray(channels, event.previousIndex, event.currentIndex);
    this.channels.set(channels);
  }

  done() {
    this.dcResult.emit(this.channels().map((value, index) => ({ id: value.id, index })));
    this.close();
  }

  close(): void {
    this.channels.set([]);
    this.isVisible.set(false);
  }

  show(channels: Channel[]) {
    this.channels.set([...channels.sort((a, b) => a.index - b.index)]);
    this.isVisible.set(true);
  }
}
