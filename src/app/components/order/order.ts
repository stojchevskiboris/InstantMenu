import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService } from '../../services/menu.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class OrderComponent {
  private menuService = inject(MenuService);
  public languageService = inject(LanguageService);

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
