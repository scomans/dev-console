import { ChangeDetectionStrategy, Component, forwardRef, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ColorSliderModule, SliderComponent } from 'ngx-color/slider';
import { SafeAny } from '@dev-console/types';


@Component({
  selector: 'dc-color-slider',
  templateUrl: './color-slider.component.html',
  styleUrls: ['./color-slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorSliderComponent),
      multi: true,
    },
  ],
  imports: [
    ColorSliderModule,
  ],
})
export class ColorSliderComponent implements ControlValueAccessor {

  onChange: SafeAny = () => undefined;
  onTouched: SafeAny = () => undefined;
  disabled = false;

  @ViewChild(SliderComponent, { static: true }) slider: SliderComponent;

  writeValue(value: string): void {
    this.slider.color = value;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  registerOnChange(fn: SafeAny): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: SafeAny): void {
    this.onTouched = fn;
  }

}
