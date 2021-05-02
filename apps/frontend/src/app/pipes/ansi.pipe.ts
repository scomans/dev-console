import { Pipe, PipeTransform } from '@angular/core';

import * as Convert from 'ansi-to-html';

@Pipe({
  name: 'ansi',
})
export class AnsiPipe implements PipeTransform {

  converter = new Convert();

  transform(value: string): string {
    return this.converter.toHtml(value);
  }
}
