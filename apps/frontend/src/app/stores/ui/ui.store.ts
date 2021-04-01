import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface UiState {
  sidebarCollapsed: boolean;
}

export function createInitialState(): UiState {
  return {
    sidebarCollapsed: true,
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'UI' })
export class UiStore extends Store<UiState> {

  constructor() {
    super(createInitialState());
  }
}
