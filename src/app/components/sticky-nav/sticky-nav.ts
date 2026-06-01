import { Component, inject, signal, effect } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sticky-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sticky-nav.html',
  styleUrl: './sticky-nav.css',
})
export class StickyNavComponent {
  private menuService = inject(MenuService);
  subCategories = () => this.menuService.currentMainCategory()?.subCategories || [];
  activeId = '';

  constructor() {
    // Sync with fragment on load
    effect(() => {
      const fragment = window.location.hash.substring(1);
      if (fragment) {
        this.activeId = fragment;
      }
    });

    // Reset activeId when main category changes
    effect(() => {
      this.menuService.selectedMainCategoryId();
      this.activeId = '';
    });
  }

  setActive(id: string) {
    this.activeId = id;
    // We could use an emitter here if we wanted to trigger the highlight manually,
    // but the effect in MenuListComponent watching the fragment should handle it.
  }
}
