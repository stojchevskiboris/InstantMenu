import { Injectable, signal, computed, inject } from '@angular/core';
import { MenuData, MainCategory, SubCategory, Product } from '../models/menu.model';
import { OrderSelectionService, OrderLineItem } from './order-selection.service';
import { MenuSearchService, ScoredMenuItem } from './menu-search.service';
import menuDataJson from '../data/menu.json';

export interface FilteredCategoryGroup {
  id: string;
  name: { [key: string]: string };
  matchCount: number;
  maxScore: number;
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
  private readonly orderSelection = inject(OrderSelectionService);
  public readonly menuSearch = inject(MenuSearchService);

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

  // Global Instant Search & Quick Filter Signals (delegated to MenuSearchService)
  public readonly searchQuery = this.menuSearch.query;
  public readonly selectedTag = this.menuSearch.activeTag;

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

  public readonly searchResults = computed<ScoredMenuItem[]>(
    () => this.menuSearch.evaluation().results
  );

  public readonly isShowingFallbackMatches = computed<boolean>(
    () => this.menuSearch.evaluation().isFallbackOnly
  );

  public readonly filteredCategoryGroups = computed<FilteredCategoryGroup[]>(() => {
    const scoredItems = this.menuSearch.evaluation().results;
    if (scoredItems.length === 0) return [];

    const categories = this._menuData().categories;
    const catOrderMap = new Map<string, number>();
    const subOrderMap = new Map<string, number>();

    categories.forEach((cat, cIdx) => {
      catOrderMap.set(cat.id, cIdx);
      cat.subCategories.forEach((sub, sIdx) => {
        subOrderMap.set(`${cat.id}:${sub.id}`, sIdx);
      });
    });

    interface TempSubGroup {
      sub: SubCategory;
      items: Product[];
      maxScore: number;
      order: number;
    }

    interface TempCatGroup {
      cat: MainCategory;
      subs: Map<string, TempSubGroup>;
      matchCount: number;
      maxScore: number;
      order: number;
    }

    const catGroups = new Map<string, TempCatGroup>();

    // scoredItems is already sorted descending by score, preserving menuIndex on ties
    for (const entry of scoredItems) {
      let cGroup = catGroups.get(entry.mainCategory.id);
      if (!cGroup) {
        cGroup = {
          cat: entry.mainCategory,
          subs: new Map<string, TempSubGroup>(),
          matchCount: 0,
          maxScore: entry.score,
          order: catOrderMap.get(entry.mainCategory.id) ?? 0,
        };
        catGroups.set(entry.mainCategory.id, cGroup);
      }

      cGroup.matchCount++;
      if (entry.score > cGroup.maxScore) {
        cGroup.maxScore = entry.score;
      }

      let sGroup = cGroup.subs.get(entry.subCategory.id);
      if (!sGroup) {
        sGroup = {
          sub: entry.subCategory,
          items: [],
          maxScore: entry.score,
          order: subOrderMap.get(`${entry.mainCategory.id}:${entry.subCategory.id}`) ?? 0,
        };
        cGroup.subs.set(entry.subCategory.id, sGroup);
      }

      if (entry.score > sGroup.maxScore) {
        sGroup.maxScore = entry.score;
      }
      sGroup.items.push(entry.product);
    }

    return Array.from(catGroups.values())
      .sort((a, b) => b.maxScore - a.maxScore || a.order - b.order)
      .map((cg) => ({
        id: cg.cat.id,
        name: cg.cat.name,
        matchCount: cg.matchCount,
        maxScore: cg.maxScore,
        subCategories: Array.from(cg.subs.values())
          .sort((a, b) => b.maxScore - a.maxScore || a.order - b.order)
          .map((sg) => ({
            ...sg.sub,
            items: sg.items,
          })),
      }));
  });

  public readonly totalFilteredMatches = computed<number>(
    () => this.menuSearch.evaluation().results.length
  );

  // Item Detail Sheet State
  public readonly selectedProduct = signal<Product | null>(null);

  // Delegated Order Accessors for Convenience
  public readonly orderItems = computed<OrderLineItem[]>(() =>
    this.orderSelection.selectedItems()
  );
  public readonly orderTotal = this.orderSelection.totalPrice;
  public readonly totalQuantity = this.orderSelection.totalItems;

  constructor() {
    this.menuSearch.setMenuData(this._menuData());
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
