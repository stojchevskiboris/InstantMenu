import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import languagesJson from '../../assets/i18n/languages.json';
import enDict from '../../assets/i18n/en.json';
import mkDict from '../../assets/i18n/mk.json';

export interface TranslationDictionary {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly http = inject(HttpClient);
  private readonly STORAGE_KEY = 'instant_menu_lang';

  public readonly languages: { [key: string]: string } = languagesJson.Languages;
  private readonly defaultLang = languagesJson.DefaultLanguage;

  private readonly bundledDictionaries: Record<string, TranslationDictionary> = {
    en: enDict as TranslationDictionary,
    mk: mkDict as TranslationDictionary,
  };

  private readonly cache = new Map<string, TranslationDictionary>();

  private readonly _currentLang = signal<string>('');
  public readonly currentLang = this._currentLang.asReadonly();

  private readonly _uiWords = signal<TranslationDictionary>({});
  public readonly uiWords = this._uiWords.asReadonly();

  constructor() {
    const saved = this.getStoredLang();
    const initialLang = saved && this.languages[saved] ? saved : this.defaultLang;

    // Seed bundled dictionary immediately so first render has zero untranslated keys
    if (this.bundledDictionaries[initialLang]) {
      this._uiWords.set(this.bundledDictionaries[initialLang]);
      this._currentLang.set(initialLang);
    }

    void this.loadLanguageDictionary(initialLang);

    effect(() => {
      const active = this._currentLang();
      if (active) {
        this.saveStoredLang(active);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = active;
        }
      }
    });
  }

  private getStoredLang(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEY) || sessionStorage.getItem(this.STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private saveStoredLang(lang: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, lang);
      sessionStorage.setItem(this.STORAGE_KEY, lang);
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }

  private async loadLanguageDictionary(lang: string): Promise<void> {
    if (this.cache.has(lang)) {
      this._uiWords.set(this.cache.get(lang)!);
      this._currentLang.set(lang);
      return;
    }

    if (this.bundledDictionaries[lang]) {
      this._uiWords.set(this.bundledDictionaries[lang]);
      this._currentLang.set(lang);
    }

    const filePath = `assets/i18n/${lang}.json`;

    try {
      const data = await firstValueFrom(this.http.get<TranslationDictionary>(filePath));
      this.cache.set(lang, data);
      this._uiWords.set(data);
      this._currentLang.set(lang);
    } catch (err) {
      if (!this.bundledDictionaries[lang]) {
        console.error(`Failed to HTTP load language file at: ${filePath}`, err);
        await this.fallbackToDefault(lang);
      } else {
        this.cache.set(lang, this.bundledDictionaries[lang]);
      }
    }
  }

  public switchLanguage(lang: string): void {
    if (this.languages[lang] && lang !== this._currentLang()) {
      void this.loadLanguageDictionary(lang);
    }
  }

  public translateObj(multilangObject: { [key: string]: string } | string | undefined): string {
    if (!multilangObject) return '';
    const activeLang = this._currentLang() || this.defaultLang;
    return typeof multilangObject === 'string'
      ? multilangObject
      : multilangObject[activeLang] ||
          multilangObject[this.defaultLang] ||
          Object.values(multilangObject)[0] ||
          '';
  }

  public translateUi(uiWord: string): string | undefined {
    return this.uiWords()[uiWord];
  }

  public translateTag(tag: string): string {
    const key = `tag_${tag.toLowerCase()}`;
    return this.uiWords()[key] || tag;
  }

  public translateAllergen(allergen: string): string {
    const key = `allergen_${allergen.toLowerCase()}`;
    return this.uiWords()[key] || allergen;
  }

  private async fallbackToDefault(failedLang: string): Promise<void> {
    if (failedLang === this.defaultLang) {
      return;
    }
    await this.loadLanguageDictionary(this.defaultLang);
  }
}
