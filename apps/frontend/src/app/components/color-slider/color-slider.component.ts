import { Component, forwardRef, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SliderComponent } from 'ngx-color/slider';

@Component({
  selector: 'cl-color-slider',
  templateUrl: './color-slider.component.html',
  styleUrls: ['./color-slider.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorSliderComponent),
      multi: true,
    },
  ],
})
export class ColorSliderComponent implements ControlValueAccessor {

  onChange: any = () => undefined;
  onTouched: any = () => undefined;
  disabled = false;

  @ViewChild(SliderComponent, { static: true }) slider: SliderComponent;

  writeValue(value: string): void {
    this.slider.color = value;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
