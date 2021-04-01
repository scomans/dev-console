import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Channel } from './channel.model';

export interface ChannelState extends EntityState<Channel, string>, ActiveState<string> {
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'Channel' })
export class ChannelStore extends EntityStore<ChannelState> {

  constructor() {
    super();
  }

}
