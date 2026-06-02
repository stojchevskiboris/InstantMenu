import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class OrderComponent {
  private menuService = inject(MenuService);

  orderItems = this.menuService.orderItems;
  orderTotal = this.menuService.orderTotal;
  totalQuantity = this.menuService.totalQuantity;

  isExpanded = signal(false);

  toggleExpand() {
    if (this.totalQuantity() > 0) {
      this.isExpanded.update(v => !v);
    }
  }

  increment(productId: string) {
    this.menuService.updateQuantity(productId, 1);
  }

  decrement(productId: string) {
    this.menuService.updateQuantity(productId, -1);
  }

  clearOrder() {
    this.menuService.clearOrder();
    this.isExpanded.set(false);
  }
}
