export interface Channel {
  id: string;
  index: number;
  name: string;
  color: string;
  arguments?: string[];
  executeIn?: string;
  executable: string;
  envFile: string;
  envVars: {
    [key: string]: string;
  };
  regex?: {
    search: string;
    replace: string;
  };
  active: boolean;
  waitOn: string[];
}
