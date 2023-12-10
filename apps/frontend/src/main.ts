import { appConfig } from './app/app.config';
import { environment } from './environments/environment';
import { enableElfProdMode } from '@ngneat/elf';
import { open } from '@tauri-apps/api/shell';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/components/app/app.component';
import { enableProdMode } from '@angular/core';

if (environment.production) {
  enableProdMode();
  enableElfProdMode();

  document.addEventListener(
    'contextmenu',
    function(event) {
      event.preventDefault();
      return false;
    },
    { capture: true },
  );

  document.onkeydown = function(e) {
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

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
