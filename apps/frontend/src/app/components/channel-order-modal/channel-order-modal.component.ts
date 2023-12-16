import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
import { Channel } from '@dev-console/types';
import { faGripLines } from '@fortawesome/free-solid-svg-icons';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NzButtonModule } from 'ng-zorro-antd/button';


@Component({
  selector: 'dc-channel-order-modal',
  templateUrl: './channel-order-modal.component.html',
  styleUrls: ['./channel-order-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    FontAwesomeModule,
    NzButtonModule,
    NzModalModule,
  ],
})
export class ChannelOrderModalComponent {

  readonly fasGripLines = faGripLines;

  channels = signal<Channel[]>([]);
  isVisible = signal(false);

  @Output() dcResult = new EventEmitter<{ id: string, index: number }[]>();

  drop(event: CdkDragDrop<string[]>) {
    const channels = this.channels();
    moveItemInArray(channels, event.previousIndex, event.currentIndex);
    this.channels.set(channels);
  }

  done() {
    this.close();
    this.dcResult.emit(this.channels().map((value, index) => ({ id: value.id, index })));
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
