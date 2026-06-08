import { Component, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/menu.model';
import { MenuService } from '../../services/menu.service';
import { TranslatePipe } from '../../pipes/translate-pipe';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './menu-item.html',
  styleUrl: './menu-item.css',
})
export class MenuItemComponent {
  item = input.required<Product>();
  private menuService = inject(MenuService);

  quantity = computed(() => this.menuService.getQuantity(this.item().id));

  increment(event: Event) {
    event.stopPropagation();
    this.menuService.updateQuantity(this.item().id, 1);
  }

  decrement(event: Event) {
    event.stopPropagation();
    this.menuService.updateQuantity(this.item().id, -1);
  }
}
