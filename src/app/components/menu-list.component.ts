import { Component, inject } from '@angular/core';
import { MenuService } from '../services/menu.service';
import { MenuItemComponent } from './menu-item.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [CommonModule, MenuItemComponent],
  template: `
    <div class="px-3 pb-5 mt-3">
      @for (sub of subCategories(); track sub.id) {
        <div [id]="sub.id" class="mb-4 pt-2">
          <h5 class="fw-bold mb-3">{{ sub.name }}</h5>
          @for (product of sub.items; track product.id) {
            <app-menu-item [item]="product"></app-menu-item>
          }
        </div>
      }
    </div>
  `
})
export class MenuListComponent {
  private menuService = inject(MenuService);
  subCategories = () => this.menuService.currentMainCategory()?.subCategories || [];
}
