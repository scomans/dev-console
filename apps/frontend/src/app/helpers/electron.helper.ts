import { map } from 'rxjs/operators';

export function mapElectronEvent<T>(electronService, event: string) {
  return electronService.on(event).pipe(
    map<any, T>(([data]) => ({ event, data }) as unknown as T),
  );
}
