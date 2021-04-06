import { Query } from '@datorama/akita';
import { UiState, UiStore } from './ui.store';

export class UiQuery extends Query<UiState> {

  constructor(protected store: UiStore) {
    super(store);
  }

}
