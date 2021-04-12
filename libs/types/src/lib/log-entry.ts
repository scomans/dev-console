export interface LogEntry {
  id: number;
  data: string;
  type: 'data' | 'error';
  timestamp: number;
}

export interface LogEntryWithSource extends LogEntry {
  source: string;
}
