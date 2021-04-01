import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Channel } from './channel.model';

export interface ChannelState extends EntityState<Channel>, ActiveState {
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'Channel' })
export class ChannelStore extends EntityStore<ChannelState> {

  constructor() {
    super();
  }

}
