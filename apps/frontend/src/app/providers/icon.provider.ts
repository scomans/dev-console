import { APP_INITIALIZER } from '@angular/core';
import { MenuFoldOutline, MenuUnfoldOutline } from '@ant-design/icons-angular/icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCircle as farCircle,
  faClock as farClock,
  faQuestionCircle as farQuestionCircle,
  faWindowClose as farWindowClose,
  faWindowMaximize as farWindowMaximize,
  faWindowMinimize as farWindowMinimize,
  faWindowRestore as farWindowRestore,
} from '@fortawesome/free-regular-svg-icons';
import {
  faAlignLeft as fasAlignLeft,
  faCircle as fasCircle,
  faDotCircle as fasDotCircle,
  faEdit as fasEdit,
  faFolderOpen as fasFolderOpen,
  faInfoCircle as fasInfoCircle,
  faLayerGroup as fasLayerGroup,
  faPlay as fasPlay,
  faPlusCircle as fasPlusCircle,
  faRedo as fasRedo,
  faStop as fasStop,
  faTerminal as fasTerminal,
  faTrash as fasTrash,
} from '@fortawesome/free-solid-svg-icons';
import { NZ_ICONS } from 'ng-zorro-antd/icon';


const farIcons = [
  farWindowMinimize,
  farWindowMaximize,
  farWindowClose,
  farWindowRestore,
  farQuestionCircle,
  farCircle,
  farClock,
];

const fasIcons = [
  fasAlignLeft,
  fasPlusCircle,
  fasTrash,
  fasEdit,
  fasPlay,
  fasTerminal,
  fasFolderOpen,
  fasStop,
  fasRedo,
  fasCircle,
  fasLayerGroup,
  fasDotCircle,
  fasInfoCircle,
];

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
