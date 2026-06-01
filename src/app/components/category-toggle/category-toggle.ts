import { Component, inject } from '@angular/core';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-category-toggle',
  imports: [],
  templateUrl: './category-toggle.html',
  styleUrl: './category-toggle.css',
})
export class CategoryToggleComponent {
  private menuService = inject(MenuService);
  selected = this.menuService.selectedMainCategoryId;

  select(id: 'drink' | 'food') {
    this.menuService.selectedMainCategoryId.set(id);
  }
}
