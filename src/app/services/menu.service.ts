import { Injectable, signal, computed, inject } from '@angular/core';
import { MenuData, MainCategory, SubCategory, Product } from '../models/menu.model';
import { LanguageService } from './language.service';
import { OrderSelectionService, OrderLineItem } from './order-selection.service';
import menuDataJson from '../data/menu.json';

export interface FilteredCategoryGroup {
  id: string;
  name: { [key: string]: string };
  matchCount: number;
  subCategories: SubCategory[];
}

const PREFERRED_TAG_ORDER = [
  'popular',
  'non-alcoholic',
  'signature',
  'cocktails',
  'vegetarian',
];

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly languageService = inject(LanguageService);
  private readonly orderSelection = inject(OrderSelectionService);

  private readonly _menuData = signal<MenuData>(menuDataJson as MenuData);
  public readonly menuData = this._menuData.asReadonly();

  // Category & Sub-category Navigation State
  public readonly selectedMainCategoryId = signal<string>(
    this._menuData().categories[0]?.id || ''
  );

  public readonly currentMainCategory = computed<MainCategory | undefined>(() =>
    this._menuData().categories.find((c) => c.id === this.selectedMainCategoryId())
  );

  public readonly activeSubCategoryId = signal<string>(
    this._menuData().categories[0]?.subCategories[0]
      ? `sub-${this._menuData().categories[0].subCategories[0].id}`
      : ''
  );

  private manualScrollTimer: ReturnType<typeof setTimeout> | null = null;
  public readonly isManualScrolling = signal<boolean>(false);

  // Global Instant Search & Quick Filter Signals
  public readonly searchQuery = signal<string>('');
  public readonly selectedTag = signal<string>('all');

  public readonly availableTags = computed<string[]>(() => {
    const tagSet = new Set<string>();
    for (const cat of this._menuData().categories) {
      for (const sub of cat.subCategories) {
        for (const item of sub.items) {
          item.tags?.forEach((t) => tagSet.add(t));
        }
      }
    }

    return Array.from(tagSet).sort((a, b) => {
      const ia = PREFERRED_TAG_ORDER.indexOf(a);
      const ib = PREFERRED_TAG_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  });

  public readonly isFilterMode = computed<boolean>(
    () => this.searchQuery().trim().length > 0 || this.selectedTag() !== 'all'
  );

  public readonly filteredCategoryGroups = computed<FilteredCategoryGroup[]>(() => {
    // Depend on active language & UI dictionary so localized tag searches stay reactive
    this.languageService.currentLang();
    this.languageService.uiWords();

    const rawQuery = this.searchQuery().trim().toLowerCase();
    const queryTokens = rawQuery ? rawQuery.split(/\s+/).filter(Boolean) : [];
    const activeTag = this.selectedTag();

    const groups: FilteredCategoryGroup[] = [];

    for (const category of this._menuData().categories) {
      const matchedSubs: SubCategory[] = [];
      let categoryMatches = 0;

      for (const sub of category.subCategories) {
        const matchedItems = sub.items.filter((item) =>
          this.matchesSearchAndTag(item, queryTokens, activeTag)
        );

        if (matchedItems.length > 0) {
          matchedSubs.push({
            ...sub,
            items: matchedItems,
          });
          categoryMatches += matchedItems.length;
        }
      }

      if (matchedSubs.length > 0) {
        groups.push({
          id: category.id,
          name: category.name,
          matchCount: categoryMatches,
          subCategories: matchedSubs,
        });
      }
    }

    return groups;
  });

  public readonly totalFilteredMatches = computed<number>(() =>
    this.filteredCategoryGroups().reduce((sum, g) => sum + g.matchCount, 0)
  );

  // Item Detail Sheet State
  public readonly selectedProduct = signal<Product | null>(null);

  // Delegated Order Accessors for Convenience
  public readonly orderItems = computed<OrderLineItem[]>(() =>
    this.orderSelection.selectedItems()
  );
  public readonly orderTotal = this.orderSelection.totalPrice;
  public readonly totalQuantity = this.orderSelection.totalItems;

  private matchesSearchAndTag(
    item: Product,
    queryTokens: string[],
    activeTag: string
  ): boolean {
    if (activeTag !== 'all') {
      if (!item.tags || !item.tags.includes(activeTag)) {
        return false;
      }
    }

    if (queryTokens.length === 0) {
      return true;
    }

    const nameValues = Object.values(item.name || {}).join(' ');
    const descValues = Object.values(item.description || {}).join(' ');
    const tagValues = (item.tags || [])
      .map((t) => `${t} ${this.languageService.translateTag(t)}`)
      .join(' ');

    const haystack = `${nameValues} ${descValues} ${tagValues}`.toLowerCase();
    return queryTokens.every((token) => haystack.includes(token));
  }

  public selectMainCategory(categoryId: string): void {
    this.selectedMainCategoryId.set(categoryId);
    const cat = this._menuData().categories.find((c) => c.id === categoryId);
    const firstSub = cat?.subCategories[0];
    this.activeSubCategoryId.set(firstSub ? `sub-${firstSub.id}` : '');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  public setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  public clearSearchQuery(): void {
    this.searchQuery.set('');
  }

  public selectTag(tag: string): void {
    this.selectedTag.update((current) => (current === tag && tag !== 'all' ? 'all' : tag));
  }

  public resetSearchAndFilters(): void {
    this.searchQuery.set('');
    this.selectedTag.set('all');
  }

  public getProductSubCategoryId(productId: string): string | null {
    for (const cat of this._menuData().categories) {
      for (const sub of cat.subCategories) {
        if (sub.items.some((i) => i.id === productId)) {
          return sub.id;
        }
      }
    }
    return null;
  }

  public getProductCategoryId(productId: string): string | null {
    for (const cat of this._menuData().categories) {
      for (const sub of cat.subCategories) {
        if (sub.items.some((i) => i.id === productId)) {
          return cat.id;
        }
      }
    }
    return null;
  }

  public lockManualScroll(sectionId: string, durationMs = 1000): void {
    this.activeSubCategoryId.set(sectionId);
    this.isManualScrolling.set(true);
    if (this.manualScrollTimer) {
      clearTimeout(this.manualScrollTimer);
    }

    const finishScroll = () => {
      if (this.manualScrollTimer) {
        clearTimeout(this.manualScrollTimer);
        this.manualScrollTimer = null;
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('scrollend', finishScroll);
      }
      this.isManualScrolling.set(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scrollend', finishScroll, { once: true });
    }
    this.manualScrollTimer = setTimeout(finishScroll, durationMs);
  }

  public getAllCategories(): MainCategory[] {
    return this._menuData().categories;
  }

  public setSelectedProduct(product: Product | null): void {
    this.selectedProduct.set(product);
  }

  public updateQuantity(productId: string, delta: number): void {
    this.orderSelection.updateQuantity(productId, delta);
  }

  public getQuantity(productId: string): number {
    return this.orderSelection.getQuantity(productId);
  }

  public clearOrder(): void {
    this.orderSelection.clearOrder();
  }
}
