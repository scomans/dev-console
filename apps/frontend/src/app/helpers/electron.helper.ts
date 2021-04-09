import { map } from 'rxjs/operators';
import { ElectronService } from '../services/electron.service';

export function mapElectronEvent<T>(electronService: ElectronService, event: string) {
  return electronService.on(event).pipe(
    map<any, T>(([data]) => ({ event, data }) as unknown as T),
  );
}
