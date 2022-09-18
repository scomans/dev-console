import { Injectable } from '@angular/core';
import { createStore, select, setProp, withProps } from '@ngneat/elf';
import { Observable } from 'rxjs';


export interface UiProps {
  sidebarCollapsed: boolean;
}

@Injectable()
export class UiRepository {

  private store = createStore(
    { name: 'ui' },
    withProps<UiProps>({
      sidebarCollapsed: false,
    }),
  );

  selectProp<T extends keyof UiProps>(prop: T): Observable<UiProps[T]> {
    return this.store.pipe(select((state) => state[prop]));
  };

  updateUiProp<T extends keyof UiProps>(prop: T, value: UiProps[T]) {
    this.store.update(
      setProp(prop, value),
    );
  }

  getUiProp<T extends keyof UiProps>(prop: T): UiProps[T] {
    return this.store.getValue()[prop];
  }

  toggleSidebar() {
    this.updateUiProp('sidebarCollapsed', !this.getUiProp('sidebarCollapsed'));
  }
}
