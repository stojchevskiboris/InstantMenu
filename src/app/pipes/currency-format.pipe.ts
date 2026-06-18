import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyPrice',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | string | undefined): string {
    if (value === undefined || value === null) {
      return '';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return value.toString();
    }

    // Round to 2 decimal places if needed, but usually menu prices are integers or .5
    return `${numValue} ден.`;
  }
}
