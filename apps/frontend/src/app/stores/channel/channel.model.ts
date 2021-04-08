export interface Channel {
  id: string;
  name: string;
  color: string;
  arguments?: string[];
  executeIn?: string;
  executable: string;
  regex?: {
    search: string;
    replace: string;
  };
  active: boolean;
}

export function createChannel(params: Partial<Channel>) {
  return {} as Channel;
}
