import { UiStore } from './ui.store';

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

  setChannelActive(channelId: string) {
    this.uiStore.update(state => ({
      activeChannel: channelId,
    }));
  }
}
