import { Store, StoreConfig } from '@datorama/akita';

export interface UiState {
  sidebarCollapsed: boolean;
  activeChannel: string;
}

export function createInitialState(): UiState {
  return {
    sidebarCollapsed: false,
    activeChannel: null,
  };
}

@StoreConfig({ name: 'UI', resettable: true })
export class UiStore extends Store<UiState> {

  constructor() {
    super(createInitialState());
  }
}
