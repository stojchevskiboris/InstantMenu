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

  increment(productId: string) {
    this.menuService.updateQuantity(productId, 1);
  }

  decrement(productId: string) {
    this.menuService.updateQuantity(productId, -1);
  }

  clearOrder() {
    this.menuService.clearOrder();
  }
}
