import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Channel } from './channel.model';

export interface ChannelState extends EntityState<Channel, string>, ActiveState<string> {
}

@StoreConfig({ name: 'Channel', resettable: true })
export class ChannelStore extends EntityStore<ChannelState> {

  constructor() {
    super();
  }
}
