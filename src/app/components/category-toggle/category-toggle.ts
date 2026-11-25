import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { MainCategory } from '../../models/menu.model';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate-pipe';

@Component({
  selector: 'app-category-toggle',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './category-toggle.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
