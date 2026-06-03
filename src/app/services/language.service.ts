import { Injectable, signal, computed, effect } from '@angular/core';
import languagesJson from '../../assets/i18n/languages.json';

interface TranslationDictionary {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  // Explicitly add an index signature mapping key string -> value string
  public readonly languages: { [key: string]: string } = languagesJson.Languages;
  private readonly defaultLang = languagesJson.DefaultLanguage;
  // 1. Read master languages config synchronously


  // 2. Vite magic: Automatically find and map all translation JSON files in the directory
  private readonly jsonModules = import.meta.glob('../../assets/i18n/*.json');

  // 3. Keep track of current selection and active loaded dictionary strings
  private readonly _currentLang = signal<string>('');
  public readonly currentLang = this._currentLang.asReadonly();

  private readonly _uiWords = signal<TranslationDictionary>({});
  public readonly uiWords = this._uiWords.asReadonly();

  constructor() {
    // Determine the starting language (sessionStorage choice or default)
    const saved = sessionStorage.getItem('instant_menu_lang');
    const initialLang = saved && this.languages[saved] ? saved : this.defaultLang;

    // Load initial dictionary immediately
    this.loadLanguageDictionary(initialLang);

    // Automatically persist language choice changes
    effect(() => {
      if (this._currentLang()) {
        sessionStorage.setItem('instant_menu_lang', this._currentLang());
      }
    });
  }

  /**
   * Dynamically imports the requested translation file on demand
   */
  private async loadLanguageDictionary(lang: string) {
    // Construct the expected file path matching the glob pattern above
    const filePath = `../../assets/i18n/${lang}.json`;

    if (this.jsonModules[filePath]) {
      try {
        // Dynamically resolve and import the JSON file bundle chunk
        const module: any = await this.jsonModules[filePath]();

        // Update both signals synchronously after resolution
        this._uiWords.set(module.default as TranslationDictionary);
        this._currentLang.set(lang);
      } catch (err) {
        console.error(`Failed to dynamically load language file for: ${lang}`, err);
        this.fallbackToDefault();
      }
    } else {
      console.warn(`Translation file not found for language key: ${lang}. Reverting.`);
      this.fallbackToDefault();
    }
  }

  // Swap language via dropdown selection
  public switchLanguage(lang: string) {
    if (this.languages[lang] && lang !== this._currentLang()) {
      this.loadLanguageDictionary(lang);
    }
  }

  // Helper method to pull the correct language string out of your product data items
  public translateObj(multilangObject: { [key: string]: string } | undefined): string {
    if (!multilangObject) return '';

    const activeLang = this._currentLang() || this.defaultLang;
    return multilangObject[activeLang] || multilangObject[this.defaultLang] || Object.values(multilangObject)[0] || '';
  }

  private async fallbackToDefault() {
    if (this._currentLang() !== this.defaultLang) {
      await this.loadLanguageDictionary(this.defaultLang);
    }
  }
}