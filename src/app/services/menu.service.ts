import { Injectable, signal, computed, effect } from '@angular/core';
import { MenuData, OrderState, MainCategory, Product } from '../models/menu.model';
import menuDataJson from '../data/menu.json';

export interface OrderItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  // Menu Data
  private readonly _menuData = signal<MenuData>(menuDataJson as MenuData);
  public readonly menuData = this._menuData.asReadonly();

  // Selection State
  public readonly selectedMainCategoryId = signal<string>(this._menuData().categories[0]?.id || '');

  public readonly currentMainCategory = computed(() =>
    this._menuData().categories.find(c => c.id === this.selectedMainCategoryId())
  );

  // Order State
  private readonly _orderState = signal<OrderState>(this.loadOrder());
  public readonly orderState = this._orderState.asReadonly();

  // Computed Order Details
  public readonly orderItems = computed<OrderItem[]>(() => {
    const state = this._orderState();
    const items: OrderItem[] = [];

    // Find products across all categories
    this._menuData().categories.forEach(category => {
      category.subCategories.forEach(sub => {
        sub.items.forEach(product => {
          if (state[product.id]) {
            items.push({
              product,
              quantity: state[product.id]
            });
          }
        });
      });
    });

    return items;
  });

  public readonly orderTotal = computed(() => {
    return this.orderItems().reduce((total, item) => total + (item.product.price * item.quantity), 0);
  });

  public readonly totalQuantity = computed(() => {
    return this.orderItems().reduce((total, item) => total + item.quantity, 0);
  });

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

  //get all categories
  public getAllCategories(): MainCategory[] {
    return this._menuData().categories;
  }

  public clearOrder() {
    this._orderState.set({});
  }
}
