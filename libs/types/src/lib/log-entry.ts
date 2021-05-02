export interface LogEntry {
  id: number;
  data: string;
  type: 'data' | 'error' | 'info';
  timestamp: number;
}

export interface LogEntryWithSource extends LogEntry {
  source: string;
}
