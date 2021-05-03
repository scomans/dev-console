import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { LogEntryWithSource } from '@dev-console/types';

@Component({
  selector: 'cl-log-entry',
  templateUrl: './log-entry.component.html',
  styleUrls: ['./log-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogEntryComponent implements OnInit {

  @Input() entry: LogEntryWithSource;
  @Input() colors: Record<string, string>;

  constructor() {
  }

  ngOnInit(): void {
  }

}
