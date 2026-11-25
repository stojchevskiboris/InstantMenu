import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(
    multilangObject: { [key: string]: string } | string | undefined,
    fallbackUiWord: string = ''
  ): string {
    if (multilangObject == null) {
      return fallbackUiWord;
    }

    if (typeof multilangObject === 'string') {
      const translated = this.languageService.translateUi(multilangObject);
      if (translated !== undefined) {
        return translated;
      }
      return fallbackUiWord || multilangObject;
    }

    return this.languageService.translateObj(multilangObject);
  }
}
