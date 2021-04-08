import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'cl-log-entry',
  templateUrl: './log-entry.component.html',
  styleUrls: ['./log-entry.component.scss'],
})
export class LogEntryComponent implements OnInit {

  @Input() entry;
  @Input() color;

  constructor() {
  }

  ngOnInit(): void {
  }

}
