import { ChangeDetectionStrategy, Component, computed, Input, Signal, signal } from '@angular/core';
import { LogEntryWithSource } from '@dev-console/types';
import { NgIf } from '@angular/common';
import { isNil } from 'lodash-es';


export type LogEntryWithSourceAndColor = LogEntryWithSource & { color: string }

@Component({
  selector: 'dc-log-entry',
  templateUrl: './log-entry.component.html',
  styleUrls: ['./log-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
  ],
})
export class LogEntryComponent {
  borderColor: Signal<string>;
  backgroundColor: Signal<string>;
  logEntry = signal<LogEntryWithSourceAndColor | undefined>(undefined);

  @Input() set entry(value: LogEntryWithSourceAndColor) {
    this.logEntry.set(value);
  }

  constructor() {
    this.borderColor = computed(() => this.logEntry().color || 'transparent');
    this.backgroundColor = computed(() => {
      const entry = this.logEntry();
      if (isNil(entry)) {
        return 'transparent';
      }
      return entry.type === 'data' ?
        entry.color + '14' :
        (entry.type === 'info' ? 'rgba(32, 178, 170, 0.1)' : 'rgba(196, 2, 2, 0.1)');
    });
  }
}
