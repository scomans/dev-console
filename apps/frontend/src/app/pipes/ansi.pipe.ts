import { Pipe, PipeTransform } from '@angular/core';

import { default as Convert } from 'ansi-to-html';


@Pipe({
  name: 'ansi',
  standalone: true,
})
export class AnsiPipe implements PipeTransform {

  converter = new Convert();

  transform(value: string): string {
    return this.converter.toHtml(value);
  }
}
