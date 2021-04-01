import { Injectable } from '@angular/core';
import { ID } from '@datorama/akita';
import { Channel } from './channel.model';
import { ChannelStore } from './channel.store';

@Injectable({ providedIn: 'root' })
export class ChannelService {

  constructor(
    private readonly channelStore: ChannelStore,
  ) {
  }

  add(channel: Channel) {
    this.channelStore.add(channel);
  }

  update(id, channel: Partial<Channel>) {
    this.channelStore.update(id, channel);
  }

  remove(id: ID) {
    this.channelStore.remove(id);
  }

  setActive(id: string) {
    this.channelStore.setActive(id);
  }
}
