import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'smartTrim',
})
export class SmartTrimPipe implements PipeTransform {

  transform(value: string, maxLength: number): string {
    if (!value) {
      return value;
    }
    if (maxLength < 1) {
      return value;
    }
    if (value.length <= maxLength) {
      return value;
    }
    if (maxLength == 1) {
      return value.substring(0, 1) + '…';
    }

    const midpoint = Math.ceil(value.length / 2);
    const toremove = value.length - maxLength;
    const lstrip = Math.ceil(toremove / 2);
    const rstrip = toremove - lstrip;
    return value.substring(0, midpoint - lstrip) + '…' + value.substring(midpoint + rstrip);
  }

}
