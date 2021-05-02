import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safe',
})
export class SafePipe implements PipeTransform {

  constructor(
    private readonly sanitizer: DomSanitizer,
  ) {
  }

  transform(value: string, type: 'html'): unknown {
    switch (type) {
      case 'html':
        return this.sanitizer.bypassSecurityTrustHtml(value);
    }
    return value;
  }
}
