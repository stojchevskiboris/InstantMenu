import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';
import th from '@angular/common/locales/th';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(multilangObject: { [key: string]: string } | string | undefined, uiWord: string = ''): string | null {
    if (multilangObject == null || multilangObject == undefined) {
      return null;
    }

    if (uiWord != '' && typeof multilangObject == 'string') {
      var word = multilangObject.toString();
      var translated = this.languageService.translateUi(word);
      return translated ?? uiWord;
    }
    return this.languageService.translateObj(multilangObject);
  }
}