import { Component, Input, OnInit } from '@angular/core';
import { LogEntry } from '../../services/log-store.service';

@Component({
  selector: 'cl-log-entry',
  templateUrl: './log-entry.component.html',
  styleUrls: ['./log-entry.component.scss'],
})
export class LogEntryComponent implements OnInit {

  @Input() entry: LogEntry;
  @Input() color;

  constructor() {
  }

  ngOnInit(): void {
  }

}
