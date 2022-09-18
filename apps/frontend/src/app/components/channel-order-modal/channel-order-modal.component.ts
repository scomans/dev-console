import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Channel } from '@dev-console/types';
import { faGripLines } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'dc-channel-order-modal',
  templateUrl: './channel-order-modal.component.html',
  styleUrls: ['./channel-order-modal.component.scss'],
})
export class ChannelOrderModalComponent implements OnInit {

  readonly fasGripLines = faGripLines;

  channels: Channel[];
  @Input() isVisible: boolean = false;

  @Output('result') resultEmitter = new EventEmitter<{ id: string, index: number }[]>();

  constructor() {
  }

  ngOnInit(): void {
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.channels, event.previousIndex, event.currentIndex);
  }

  done() {
    this.isVisible = false;
    this.resultEmitter.emit(this.channels.map((value, index) => ({ id: value.id, index })));
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  show(channels: Channel[]) {
    this.channels = [...channels.sort((a, b) => a.index - b.index)];
    this.isVisible = true;
  }
}
