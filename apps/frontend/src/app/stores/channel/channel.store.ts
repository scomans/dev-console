import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Channel } from '@dev-console/types';

export interface ChannelState extends EntityState<Channel, string>, ActiveState<string> {
}

@StoreConfig({ name: 'Channel', resettable: true })
export class ChannelStore extends EntityStore<ChannelState> {

  constructor() {
    super();
  }
}
