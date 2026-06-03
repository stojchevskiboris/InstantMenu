import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import languagesJson from '../../assets/i18n/languages.json';

interface TranslationDictionary {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly http = inject(HttpClient);

  public readonly languages: { [key: string]: string } = languagesJson.Languages;
  private readonly defaultLang = languagesJson.DefaultLanguage;

  private readonly _currentLang = signal<string>('');
  public readonly currentLang = this._currentLang.asReadonly();

  private readonly _uiWords = signal<TranslationDictionary>({});
  public readonly uiWords = this._uiWords.asReadonly();

  constructor() {
    const saved = sessionStorage.getItem('instant_menu_lang');
    const initialLang = saved && this.languages[saved] ? saved : this.defaultLang;

    this.loadLanguageDictionary(initialLang);

    effect(() => {
      if (this._currentLang()) {
        sessionStorage.setItem('instant_menu_lang', this._currentLang());
      }
    });
  }

  private async loadLanguageDictionary(lang: string) {
    const filePath = `assets/i18n/${lang}.json`;

    try {
      const data = await firstValueFrom(
        this.http.get<TranslationDictionary>(filePath)
      );

      this._uiWords.set(data);
      this._currentLang.set(lang);
    } catch (err) {
      console.error(`Failed to HTTP load language file at: ${filePath}`, err);
      this.fallbackToDefault(lang);
    }
  }

  public switchLanguage(lang: string) {
    if (this.languages[lang] && lang !== this._currentLang()) {
      this.loadLanguageDictionary(lang);
    }
  }

  public translateObj(multilangObject: { [key: string]: string } | undefined): string {
    if (!multilangObject) return '';
    const activeLang = this._currentLang() || this.defaultLang;
    return multilangObject[activeLang] || multilangObject[this.defaultLang] || Object.values(multilangObject)[0] || '';
  }

  private async fallbackToDefault(failedLang: string) {
    if (failedLang === this.defaultLang) {
      console.error(`Critical: Default language file (${this.defaultLang}.json) missing from assets or server unreachable.`);
      return;
    }
    await this.loadLanguageDictionary(this.defaultLang);
  }
}