import { Channel } from '@dev-console/types';
import { ChannelStore } from './channel.store';

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

  remove(id: string) {
    this.channelStore.remove(id);
  }

  setActive(id: string) {
    this.channelStore.setActive(id);
  }
}
