import { APP_INITIALIZER } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faWindowClose as farWindowClose,
  faWindowMaximize as farWindowMaximize,
  faWindowMinimize as farWindowMinimize,
  faWindowRestore as farWindowRestore,
} from '@fortawesome/free-regular-svg-icons';


const farIcons = [
  farWindowMinimize,
  farWindowMaximize,
  farWindowClose,
  farWindowRestore,
];

const fasIcons = [];

const fadIcons = [];

const falIcons = [];

function iconFactory(library: FaIconLibrary) {
  return () => {
    library.addIcons(...fasIcons, ...farIcons);
  };
}

export const iconProvider = {
  provide: APP_INITIALIZER,
  useFactory: iconFactory,
  deps: [FaIconLibrary],
  multi: true,
};
