import { Injectable } from '@angular/core';
import { UiStore } from './ui.store';

@Injectable({ providedIn: 'root' })
export class UiService {

  constructor(
    private uiStore: UiStore,
  ) {
  }

  openSidebar(open: boolean) {
    this.uiStore.update(state => ({
      sidebarCollapsed: !open,
    }));
  }

  toggleSidebar() {
    this.uiStore.update(state => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    }));
  }
}
