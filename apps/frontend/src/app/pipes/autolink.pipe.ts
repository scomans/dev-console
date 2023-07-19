import { Pipe, PipeTransform } from '@angular/core';
import { isEmpty } from '@dev-console/helpers';

export interface AutolinkOptions {
  target?: '_blank' | string;
  rel?: string;
  id?: string;
  renderer?: (url: string) => string;
}

@Pipe({
  name: 'autolink',
  standalone: true,
})
export class AutolinkPipe implements PipeTransform {

  transform(value: string, options?: AutolinkOptions): string {
    if (typeof value === 'string') {
      return this.autolink(value, options);
    }
    return value;
  }

  autolink(str: string, options: AutolinkOptions) {
    const pattern = /(^|[\s\n]|<[A-Za-z]*\/?>)((?:https?|ftp):\/\/[\-A-Z0-9+\u0026\u2019@#\/%?=()~_|!:,.;]*[\-A-Z0-9+\u0026@#\/%=~()_|])/gi;
    const linkAttributes = [];
    const { rel, target, id } = options ?? {};
    if (!isEmpty(rel)) {
      linkAttributes.push(`rel='${rel}'`);
    }
    if (!isEmpty(target)) {
      linkAttributes.push(`target='${target}'`);
    }
    if (!isEmpty(id)) {
      linkAttributes.push(`rel='${id}'`);
    }
    return str.replace(pattern, function (match, space, url) {
      const link = (
        typeof options?.renderer === 'function' ?
          options.renderer(url) :
          void 0
      ) || ('<a href=\'' + url + '\'' + linkAttributes.join(' ') + '>' + url + '</a>');
      return '' + space + link;
    });
  };
}
