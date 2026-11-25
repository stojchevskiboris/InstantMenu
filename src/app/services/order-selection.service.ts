import { Injectable, signal, computed, effect } from '@angular/core';
import { Product, SelectedOrderEntry, MenuData } from '../models/menu.model';
import menuDataJson from '../data/menu.json';

export interface OrderLineItem {
  product: Product;
  quantity: number;
  note: string;
  checked: boolean;
  subtotal: number;
}

@Injectable({
  providedIn: 'root',
})
export class OrderSelectionService {
  private readonly menuData = menuDataJson as MenuData;
  private readonly productMap = new Map<string, Product>();
  private readonly storageKey: string;

  private readonly _entries = signal<Record<string, SelectedOrderEntry>>({});
  public readonly entries = this._entries.asReadonly();

  // Holds draft notes typed in the detail sheet before an item has quantity >= 1
  private readonly _draftNotes = signal<Record<string, string>>({});

  public readonly isDrawerOpen = signal<boolean>(false);
  public readonly isWaiterMode = signal<boolean>(false);

  public readonly selectedItems = computed<OrderLineItem[]>(() => {
    const currentEntries = this._entries();
    const list: OrderLineItem[] = [];

    for (const category of this.menuData.categories) {
      for (const sub of category.subCategories) {
        for (const product of sub.items) {
          const entry = currentEntries[product.id];
          if (entry && entry.quantity > 0) {
            list.push({
              product,
              quantity: entry.quantity,
              note: entry.note || '',
              checked: Boolean(entry.checked),
              subtotal: product.price * entry.quantity,
            });
          }
        }
      }
    }

    return list;
  });

  public readonly totalItems = computed<number>(() =>
    this.selectedItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  public readonly totalPrice = computed<number>(() =>
    this.selectedItems().reduce((sum, item) => sum + item.subtotal, 0)
  );

  public readonly checkedCount = computed<number>(() =>
    this.selectedItems().filter((item) => item.checked).length
  );

  constructor() {
    for (const category of this.menuData.categories) {
      for (const sub of category.subCategories) {
        for (const item of sub.items) {
          this.productMap.set(item.id, item);
        }
      }
    }

    const rawVenueId =
      this.menuData.venue.id || this.menuData.venue.name['en'] || 'default-venue';
    const venueSlug = rawVenueId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    this.storageKey = `instant_menu_order_${venueSlug}`;

    this._entries.set(this.loadFromStorage());

    effect(() => {
      const snapshot = this._entries();
      this.saveToStorage(snapshot);
    });
  }

  private loadFromStorage(): Record<string, SelectedOrderEntry> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, SelectedOrderEntry | number>;
      const normalized: Record<string, SelectedOrderEntry> = {};

      for (const [id, val] of Object.entries(parsed)) {
        if (!this.productMap.has(id)) continue;
        if (typeof val === 'number' && val > 0) {
          normalized[id] = { productId: id, quantity: val };
        } else if (val && typeof val === 'object' && val.quantity > 0) {
          normalized[id] = {
            productId: id,
            quantity: Math.floor(val.quantity),
            note: val.note || undefined,
            checked: Boolean(val.checked),
          };
        }
      }
      return normalized;
    } catch {
      return {};
    }
  }

  private saveToStorage(entries: Record<string, SelectedOrderEntry>): void {
    try {
      if (Object.keys(entries).length === 0) {
        localStorage.removeItem(this.storageKey);
      } else {
        localStorage.setItem(this.storageKey, JSON.stringify(entries));
      }
    } catch {
      // Ignore quota / restricted storage errors
    }
  }

  public getQuantity(productId: string): number {
    return this._entries()[productId]?.quantity || 0;
  }

  public getNote(productId: string): string {
    return this._entries()[productId]?.note ?? this._draftNotes()[productId] ?? '';
  }

  public updateQuantity(productId: string, delta: number): void {
    const current = this.getQuantity(productId);
    this.setQuantity(productId, Math.max(0, current + delta));
  }

  public increment(productId: string): void {
    this.updateQuantity(productId, 1);
  }

  public decrement(productId: string): void {
    this.updateQuantity(productId, -1);
  }

  public setQuantity(productId: string, quantity: number): void {
    const nextQty = Math.max(0, Math.floor(quantity));
    const draftNote = this._draftNotes()[productId];

    this._entries.update((state) => {
      const next = { ...state };
      if (nextQty === 0) {
        delete next[productId];
      } else {
        const existing = next[productId];
        const resolvedNote = existing?.note ?? draftNote;
        next[productId] = {
          productId,
          quantity: nextQty,
          note: resolvedNote ? resolvedNote.trim() : undefined,
          checked: existing?.checked ?? false,
        };
      }
      return next;
    });

    if (nextQty > 0 && draftNote !== undefined) {
      this._draftNotes.update((drafts) => {
        const nextDrafts = { ...drafts };
        delete nextDrafts[productId];
        return nextDrafts;
      });
    }

    if (this.totalItems() === 0) {
      this.isDrawerOpen.set(false);
      this.isWaiterMode.set(false);
    }
  }

  public updateNote(productId: string, note: string): void {
    const cleaned = note;
    if (this.getQuantity(productId) > 0) {
      this._entries.update((state) => {
        const existing = state[productId];
        if (!existing) return state;
        return {
          ...state,
          [productId]: {
            ...existing,
            note: cleaned.trim() ? cleaned : undefined,
          },
        };
      });
    } else {
      this._draftNotes.update((drafts) => ({
        ...drafts,
        [productId]: cleaned,
      }));
    }
  }

  public toggleChecked(productId: string): void {
    this._entries.update((state) => {
      const existing = state[productId];
      if (!existing) return state;
      return {
        ...state,
        [productId]: {
          ...existing,
          checked: !existing.checked,
        },
      };
    });
  }

  public openDrawer(waiterMode?: boolean): void {
    if (waiterMode !== undefined) {
      this.isWaiterMode.set(waiterMode);
    }
    this.isDrawerOpen.set(true);
  }

  public closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  public toggleWaiterMode(): void {
    this.isWaiterMode.update((v) => !v);
  }

  public clearOrder(): void {
    this._entries.set({});
    this._draftNotes.set({});
    this.isWaiterMode.set(false);
    this.isDrawerOpen.set(false);
  }
}
