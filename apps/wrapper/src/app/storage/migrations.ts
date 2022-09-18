import * as Store from 'electron-store';


export const migrations: Store.Options<any>['migrations'] = {
  '1.3.0': (store) => {
    console.log('UPDATE');
    if (store.has('storage.Channel')) {
      const channel = store.get('storage.Channel');
      store.set('storage.channel', channel);
      store.delete('storage.Channel');
    }
  },
};
