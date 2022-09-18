import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LogEntryWithSource } from '@dev-console/types';


export type LogEntryWithSourceAndColor = LogEntryWithSource & { color: string }

@Component({
  selector: 'dc-log-entry',
  templateUrl: './log-entry.component.html',
  styleUrls: ['./log-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogEntryComponent {

  borderColor: string;
  backgroundColor: string;

  private _entry: LogEntryWithSourceAndColor;

  get entry(): LogEntryWithSourceAndColor {
    return this._entry;
  }

  @Input() set entry(value: LogEntryWithSourceAndColor) {
    this._entry = value;
    this.updateColors();
  }

  updateColors() {
    if (this._entry) {
      this.borderColor = this._entry.color;
      this.backgroundColor = this._entry.type === 'data' ?
        this._entry.color + '14' :
        (this._entry.type === 'info' ? 'rgba(32, 178, 170, 0.1)' : 'rgba(196, 2, 2, 0.1)');
    }
  }

}
