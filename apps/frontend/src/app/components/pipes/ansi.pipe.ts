import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import * as Convert from 'ansi-to-html';

@Pipe({
  name: 'ansi',
})
export class AnsiPipe implements PipeTransform {

  converter = new Convert();

  constructor(
    private readonly sanitizer: DomSanitizer,
  ) {
  }

  transform(value: string): SafeHtml {
    const html = this.converter.toHtml(value);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
