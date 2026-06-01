import { Injectable, signal, computed, effect } from '@angular/core';
import { MenuData, OrderState, MainCategory } from '../models/menu.model';
import menuDataJson from '../data/menu.json';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  // Menu Data
  private readonly _menuData = signal<MenuData>(menuDataJson as MenuData);
  public readonly menuData = this._menuData.asReadonly();

  // Selection State
  public readonly selectedMainCategoryId = signal<'drink' | 'food'>('drink');

  public readonly currentMainCategory = computed(() =>
    this._menuData().categories.find(c => c.id === this.selectedMainCategoryId())
  );

  // Order State
  private readonly _orderState = signal<OrderState>(this.loadOrder());

  public readonly orderState = this._orderState.asReadonly();

  constructor() {
    // Persist order state to sessionStorage whenever it changes
    effect(() => {
      sessionStorage.setItem('lounge_menu_order', JSON.stringify(this._orderState()));
    });
  }

  private loadOrder(): OrderState {
    const saved = sessionStorage.getItem('lounge_menu_order');
    return saved ? JSON.parse(saved) : {};
  }

  public updateQuantity(productId: string, delta: number) {
    this._orderState.update(state => {
      const current = state[productId] || 0;
      const next = Math.max(0, current + delta);

      const newState = { ...state };
      if (next === 0) {
        delete newState[productId];
      } else {
        newState[productId] = next;
      }
      return newState;
    });
  }

  public getQuantity(productId: string): number {
    return this._orderState()[productId] || 0;
  }
}
