import { Component, inject } from '@angular/core';
import { MenuService } from '../services/menu.service';

@Component({
  selector: 'app-category-toggle',
  standalone: true,
  template: `
    <div class="px-3 py-2 bg-white">
      <div class="d-flex bg-light rounded-pill p-1 shadow-sm">
        <button class="btn flex-fill rounded-pill py-2 fw-bold transition-all"
                [class.btn-dark]="selected() === 'drink'"
                [class.btn-light]="selected() !== 'drink'"
                (click)="select('drink')">
          Drinks
        </button>
        <button class="btn flex-fill rounded-pill py-2 fw-bold transition-all"
                [class.btn-dark]="selected() === 'food'"
                [class.btn-light]="selected() !== 'food'"
                (click)="select('food')">
          Food
        </button>
      </div>
    </div>
  `,
  styles: [`
    .transition-all { transition: all 0.2s ease-in-out; }
  `]
})
export class CategoryToggleComponent {
  private menuService = inject(MenuService);
  selected = this.menuService.selectedMainCategoryId;

  select(id: 'drink' | 'food') {
    this.menuService.selectedMainCategoryId.set(id);
  }
}
