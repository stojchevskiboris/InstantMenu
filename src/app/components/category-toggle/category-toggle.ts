import { Component, inject } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { MainCategory } from '../../models/menu.model';

@Component({
  selector: 'app-category-toggle',
  imports: [],
  templateUrl: './category-toggle.html',
  styleUrl: './category-toggle.css',
})
export class CategoryToggleComponent {
  private menuService = inject(MenuService);

  categories: MainCategory[] = this.menuService.getAllCategories();
  selected = this.menuService.selectedMainCategoryId;

  select(id: string) {
    this.menuService.selectedMainCategoryId.set(id);
  }
}
