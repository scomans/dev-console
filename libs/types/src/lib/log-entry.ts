import { SafeHtml } from '@angular/platform-browser';

export interface LogEntry {
  id: number;
  data: string | SafeHtml;
  type: 'data' | 'error' | 'info';
  timestamp: number;
}

export interface LogEntryWithSource extends LogEntry {
  source: string;
}
