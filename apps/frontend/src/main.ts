import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { enableElfProdMode } from '@ngneat/elf';
import { open } from '@tauri-apps/api/shell';

if (environment.production) {
  enableProdMode();
  enableElfProdMode();

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

navigation.addEventListener('navigate', (event) => {
  if (!event.destination.url.startsWith(environment.baseUrl)) {
    event.preventDefault();
    void open(event.destination.url);
  }
});

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
