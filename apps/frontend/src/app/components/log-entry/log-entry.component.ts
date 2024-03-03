import { ChangeDetectionStrategy, Component, computed, input, Signal } from '@angular/core';
import { LogEntryWithSource } from '@dev-console/types';
import { isNil } from 'lodash-es';


export type LogEntryWithSourceAndColor = LogEntryWithSource & { color: string }

@Component({
  selector: 'dc-log-entry',
  templateUrl: './log-entry.component.html',
  styleUrls: ['./log-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class LogEntryComponent {
  protected readonly borderColor: Signal<string>;
  protected readonly backgroundColor: Signal<string>;
  entry = input.required<LogEntryWithSourceAndColor>();


  constructor() {
    this.borderColor = computed(() => this.entry().color || 'transparent');
    this.backgroundColor = computed(() => {
      const entry = this.entry();
      if (isNil(entry)) {
        return 'transparent';
      }
      return entry.type === 'data' ?
        entry.color + '14' :
        (entry.type === 'info' ? 'rgba(32, 178, 170, 0.1)' : 'rgba(196, 2, 2, 0.1)');
    });
  }
}
