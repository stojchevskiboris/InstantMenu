import { Component, inject, input } from '@angular/core';
import { Product } from '../../models/menu.model';
import { MenuService } from '../../services/menu.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-item',
  imports: [CommonModule],
  templateUrl: './menu-item.html',
  styleUrl: './menu-item.css',
})
export class MenuItemComponent {
  private menuService = inject(MenuService);
  item = input.required<Product>();

  quantity = () => this.menuService.getQuantity(this.item().id);

  increment(event: Event) {
    event.stopPropagation();
    this.menuService.updateQuantity(this.item().id, 1);
  }

  decrement(event: Event) {
    event.stopPropagation();
    this.menuService.updateQuantity(this.item().id, -1);
  }
}
