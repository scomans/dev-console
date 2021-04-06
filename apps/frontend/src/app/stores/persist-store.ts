import { getValue, HashMap, isNil, MaybeAsync, setAction, setValue, Store } from '@datorama/akita';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { observify } from '../helpers/observable.helper';

export interface PersistStateStorage {
  getItem(): MaybeAsync;

  setItem(value: any): MaybeAsync;

  clear(): void;
}

export interface PersistStateParams {
  storage: PersistStateStorage;

  preStorageUpdate(storeName: string, state: any): any;

  preStoreUpdate(storeName: string, state: any, initialState: any): any;
}

export interface PersistState {
  destroy(): void;

  /**
   * @deprecated Use clearStore instead.
   */
  clear(): void;

  clearStore(storeName?: string): void;
}

export function persistState(params: Partial<PersistStateParams>, __stores__: Store[]): PersistState {
  const defaults: PersistStateParams = {
    storage: params.storage,
    preStorageUpdate: function (storeName, state) {
      return state;
    },
    preStoreUpdate: function (storeName, state) {
      return state;
    },
  };

  const { storage, preStorageUpdate, preStoreUpdate } = Object.assign({}, defaults, params);

  if (!storage) {
    return;
  }

  let stores: HashMap<Subscription> = {};
  let acc = {};

  const buffer = [];

  function _save(v: any) {
    observify(v).subscribe(() => {
      const next = buffer.shift();
      next && _save(next);
    });
  }

  observify(storage.getItem()).subscribe((storageState: any) => {
    storageState = storageState ?? {};

    function save() {
      storageState = {
        ...storageState,
        ...acc,
      };

      buffer.push(storage.setItem(storageState));
      _save(buffer.shift());
    }

    function subscribe(store: Store) {
      const storeName = store.storeName;
      const path = storeName;
      stores[storeName] = store
        ._select((state) => getValue(state, path))
        .pipe(
          skip(1),
        )
        .subscribe((data) => {
          acc[storeName] = preStorageUpdate(storeName, data);
          Promise.resolve().then(() => save());
        });
    }

    function setInitial(storeName, store, path) {
      if (storeName in storageState) {
        setAction('@PersistState');
        store._setState((state) => {
          return setValue(state, path, preStoreUpdate(storeName, storageState[storeName], state));
        });
        store.setHasCache(false, { restartTTL: true });
      }
    }

    for (const store of __stores__) {
      setInitial(store.storeName, store, store.storeName);
      subscribe(store);
    }
  });

  return {
    destroy() {
      for (let i = 0, keys = Object.keys(stores); i < keys.length; i++) {
        const storeName = keys[i];
        stores[storeName].unsubscribe();
      }
      stores = {};
    },
    clear() {
      storage.clear();
    },
    clearStore(storeName?: string) {
      if (isNil(storeName)) {
        const value = observify(storage.setItem({}));
        value.subscribe();
        return;
      }
      const value = storage.getItem();
      observify(value).subscribe((v) => {
        const storageState = v || {};

        if (storageState[storeName]) {
          delete storageState[storeName];
          const value = observify(storage.setItem(storageState));
          value.subscribe();
        }
      });
    },
  };
}
