import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();

  document.addEventListener(
    'contextmenu',
    function (event) {
      event.preventDefault();
      return false;
    },
    { capture: true },
  );

  document.onkeydown = function (e) {
    if (e.ctrlKey && e.shiftKey) {
      switch (e.code.toLowerCase()) {
        case 'keyi':
        case 'keyj':
        case 'keyc':
          console.log('PREVENT');
          return false;
      }
    } else if (e.ctrlKey) {
      switch (e.code.toLowerCase()) {
        case 'semicolon':
        case 'keyr':
        case 'keyu':
        case 'keyp':
        case 'f5':
          return false;
      }
    } else {
      switch (e.code.toLowerCase()) {
        case 'f5':
        case 'f7':
        case 'f12':
          return false;
      }
    }
  };
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
