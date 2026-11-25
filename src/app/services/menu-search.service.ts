import { Injectable, computed, inject, signal } from '@angular/core';
import { MainCategory, MenuData, Product, SubCategory } from '../models/menu.model';
import { LanguageService } from './language.service';
import {
  buildIndexedField,
  evaluateIndexedItem,
  IndexedField,
  IndexedItemFields,
  normalizeText,
  prepareQueryTokens,
  toCollapsed,
} from '../utils/menu-search.util';
import enDict from '../../assets/i18n/en.json';
import mkDict from '../../assets/i18n/mk.json';

export interface IndexedMenuRecord {
  product: Product;
  mainCategory: MainCategory;
  subCategory: SubCategory;
  menuIndex: number;
  fields: IndexedItemFields;
}

export interface ScoredMenuItem {
  product: Product;
  mainCategory: MainCategory;
  subCategory: SubCategory;
  menuIndex: number;
  score: number;
  directActiveLocaleMatch: boolean;
}

export interface MenuSearchEvaluation {
  query: string;
  results: ScoredMenuItem[];
  isFallbackOnly: boolean;
  durationMs: number;
}

@Injectable({
  providedIn: 'root',
})
export class MenuSearchService {
  private readonly languageService = inject(LanguageService);

  private readonly _menuData = signal<MenuData | null>(null);
  public readonly query = signal<string>('');
  public readonly activeTag = signal<string>('all');

  private readonly knownTagDictionaries: Record<string, Record<string, string>> = {
    en: enDict as Record<string, string>,
    mk: mkDict as Record<string, string>,
  };

  /**
   * Pre-computed cross-locale & category search index.
   * Rebuilds only when menuData or loaded UI dictionaries change.
   */
  public readonly searchIndex = computed<IndexedMenuRecord[]>(() => {
    const data = this._menuData();
    if (!data) return [];

    const activeLang = this.languageService.currentLang();
    const activeWords = this.languageService.uiWords();
    const dicts: Record<string, Record<string, string>> = {
      ...this.knownTagDictionaries,
      ...(activeLang && Object.keys(activeWords).length > 0 ? { [activeLang]: activeWords } : {}),
    };

    const localeKeys = new Set<string>(Object.keys(this.languageService.languages || {}));
    localeKeys.add('mk');
    localeKeys.add('en');

    const records: IndexedMenuRecord[] = [];
    let orderCounter = 0;

    for (const mainCat of data.categories) {
      const mainCatNames = Object.values(mainCat.name || {}).filter(Boolean);
      Object.keys(mainCat.name || {}).forEach((k) => localeKeys.add(k));

      for (const subCat of mainCat.subCategories) {
        const subCatNames = Object.values(subCat.name || {}).filter(Boolean);
        Object.keys(subCat.name || {}).forEach((k) => localeKeys.add(k));

        const sharedCategoryStrings = [...mainCatNames, ...subCatNames];

        for (const product of subCat.items) {
          Object.keys(product.name || {}).forEach((k) => localeKeys.add(k));
          Object.keys(product.description || {}).forEach((k) => localeKeys.add(k));

          // 1. Primary fields: all locale item names + optional aliases
          const primaryStrings = [
            ...Object.values(product.name || {}),
            ...(product.aliases || []),
          ].filter(Boolean);
          const primaryFields: IndexedField[] = primaryStrings.map((s) => buildIndexedField(s));

          // 2. Category & tag fields across all locales
          const tagStrings: string[] = [];
          for (const tag of product.tags || []) {
            tagStrings.push(tag);
            const tagKey = `tag_${tag.toLowerCase()}`;
            for (const d of Object.values(dicts)) {
              if (d[tagKey]) tagStrings.push(d[tagKey]);
            }
          }
          const categoryFields: IndexedField[] = [...sharedCategoryStrings, ...tagStrings]
            .filter(Boolean)
            .map((s) => buildIndexedField(s));

          // 3. Secondary fields: item descriptions across all locales
          const descriptionFields: IndexedField[] = Object.values(product.description || {})
            .filter(Boolean)
            .map((s) => buildIndexedField(s));

          // 4. Per-locale normalized direct-substring lookup blobs (for fallback pill detection)
          const localeSearchBlobs: Record<string, { spaced: string; collapsed: string }> = {};
          for (const loc of localeKeys) {
            const locDict = dicts[loc] || {};
            const locTags = (product.tags || [])
              .map((t) => `${t} ${locDict[`tag_${t.toLowerCase()}`] || ''}`)
              .join(' ');
            const rawLocaleText = [
              product.name?.[loc] || '',
              mainCat.name?.[loc] || '',
              subCat.name?.[loc] || '',
              product.description?.[loc] || '',
              locTags,
            ].join(' ');
            const normLocale = normalizeText(rawLocaleText);
            localeSearchBlobs[loc] = {
              spaced: normLocale,
              collapsed: toCollapsed(normLocale),
            };
          }

          records.push({
            product,
            mainCategory: mainCat,
            subCategory: subCat,
            menuIndex: orderCounter++,
            fields: {
              primaryFields,
              categoryFields,
              descriptionFields,
              localeSearchBlobs,
            },
          });
        }
      }
    }

    return records;
  });

  public readonly evaluation = computed<MenuSearchEvaluation>(() => {
    return this.evaluateQuery(
      this.query(),
      this.activeTag(),
      this.languageService.currentLang() || 'mk'
    );
  });

  public setMenuData(data: MenuData): void {
    this._menuData.set(data);
    // Warm the pre-computed index once on data load so keystrokes run in < 5ms
    this.searchIndex();
  }

  public evaluateQuery(
    rawQuery: string,
    tagFilter: string = 'all',
    activeLocale: string = this.languageService.currentLang() || 'mk'
  ): MenuSearchEvaluation {
    const index = this.searchIndex();
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const trimmed = rawQuery.trim();
    const queryTokens = prepareQueryTokens(trimmed);

    const matched: ScoredMenuItem[] = [];
    let directHits = 0;

    for (const record of index) {
      if (tagFilter !== 'all') {
        if (!record.product.tags || !record.product.tags.includes(tagFilter)) {
          continue;
        }
      }

      if (queryTokens.length === 0) {
        matched.push({
          product: record.product,
          mainCategory: record.mainCategory,
          subCategory: record.subCategory,
          menuIndex: record.menuIndex,
          score: 0,
          directActiveLocaleMatch: true,
        });
        directHits++;
        continue;
      }

      const evalResult = evaluateIndexedItem(queryTokens, record.fields, activeLocale);
      if (evalResult) {
        if (evalResult.directActiveLocaleMatch) {
          directHits++;
        }
        matched.push({
          product: record.product,
          mainCategory: record.mainCategory,
          subCategory: record.subCategory,
          menuIndex: record.menuIndex,
          score: evalResult.score,
          directActiveLocaleMatch: evalResult.directActiveLocaleMatch,
        });
      }
    }

    // Sort descending by total score, preserving original menu order on ties
    matched.sort((a, b) => b.score - a.score || a.menuIndex - b.menuIndex);

    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const isFallbackOnly =
      queryTokens.length > 0 && matched.length > 0 && directHits === 0;

    return {
      query: trimmed,
      results: matched,
      isFallbackOnly,
      durationMs: end - start,
    };
  }
}
