import { APP_INITIALIZER } from '@angular/core';
import { persistState } from '@datorama/akita';
import { StorageService } from '../services/storage.service';

const storeFilters = {};

export const storageProvider = {
  provide: APP_INITIALIZER,
  useFactory: (storageService: StorageService) => {
    return () => persistState({
      storage: {
        getItem: () => storageService.get('storage'),
        clear: () => storageService.delete('storage'),
        setItem: (key, value) => storageService.set('storage', value),
      },
      preStorageUpdate(storeName, state) {
        if (storeFilters[storeName]) {
          return storeFilters[storeName](state);
        }
        return state;
      },
    });
  },
  deps: [StorageService],
  multi: true,
};
