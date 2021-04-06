import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'callFunction',
})
export class CallFunctionPipe implements PipeTransform {

  transform(
    value: any,
    func: (...params: any) => any,
    ...params: any[]
  ): any {
    return func(value, ...params);
  }
}
