import { QueryEntity } from '@datorama/akita';
import { ChannelState, ChannelStore } from './channel.store';

export class ChannelQuery extends QueryEntity<ChannelState> {

  constructor(protected store: ChannelStore) {
    super(store);
  }
}
