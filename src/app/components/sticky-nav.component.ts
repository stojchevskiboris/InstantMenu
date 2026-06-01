import { Component, inject } from '@angular/core';
import { MenuService } from '../services/menu.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sticky-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sticky-top border-bottom shadow-sm overflow-x-auto py-2 px-3 bg-white no-scrollbar">
      <div class="d-flex flex-nowrap gap-2">
        @for (sub of subCategories(); track sub.id) {
          <a [href]="'#' + sub.id"
             class="btn btn-sm rounded-pill px-3 py-1 text-nowrap"
             [class.btn-dark]="activeId === sub.id"
             [class.btn-light]="activeId !== sub.id"
             (click)="setActive(sub.id)">
            {{ sub.name }}
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class StickyNavComponent {
  private menuService = inject(MenuService);
  subCategories = () => this.menuService.currentMainCategory()?.subCategories || [];
  activeId = '';

  setActive(id: string) {
    this.activeId = id;
  }
}
