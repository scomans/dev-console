import { APP_INITIALIZER } from '@angular/core';
import { MenuFoldOutline, MenuUnfoldOutline } from '@ant-design/icons-angular/icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faQuestionCircle as farQuestionCircle,
  faWindowClose as farWindowClose,
  faWindowMaximize as farWindowMaximize,
  faWindowMinimize as farWindowMinimize,
  faWindowRestore as farWindowRestore,
} from '@fortawesome/free-regular-svg-icons';
import {
  faAlignLeft as fasAlignLeft,
  faEdit as fasEdit,
  faPlay as fasPlay,
  faPlusCircle as fasPlusCircle,
  faTrash as fasTrash,
} from '@fortawesome/free-solid-svg-icons';
import { NZ_ICONS } from 'ng-zorro-antd/icon';


const farIcons = [
  farWindowMinimize,
  farWindowMaximize,
  farWindowClose,
  farWindowRestore,
  farQuestionCircle,
];

const fasIcons = [
  fasAlignLeft,
  fasPlusCircle,
  fasTrash,
  fasEdit,
  fasPlay,
];

const fadIcons = [];

const falIcons = [];

const nzIcons = [
  MenuFoldOutline,
  MenuUnfoldOutline,
];

function iconFactory(library: FaIconLibrary) {
  return () => {
    library.addIcons(...fasIcons, ...farIcons);
  };
}

export const iconProvider = [
  {
    provide: APP_INITIALIZER,
    useFactory: iconFactory,
    deps: [FaIconLibrary],
    multi: true,
  },
  {
    provide: NZ_ICONS,
    useValue: nzIcons,
  },
];
