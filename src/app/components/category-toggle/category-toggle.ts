import { Component, inject } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { MainCategory } from '../../models/menu.model';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-category-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-toggle.html',
  styleUrl: './category-toggle.css',
})
export class CategoryToggleComponent {
  private menuService = inject(MenuService);
  public languageService = inject(LanguageService);

  categories: MainCategory[] = this.menuService.getAllCategories();
  selected = this.menuService.selectedMainCategoryId;

  select(id: string) {
    this.menuService.selectedMainCategoryId.set(id);
  }
}
