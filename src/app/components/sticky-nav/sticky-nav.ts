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
    // Keep activeId in sync with the URL fragment (initial load + subsequent hash changes)
    effect((onCleanup) => {
      const syncFromHash = () => {
        this.activeId = window.location.hash.substring(1);
      };

      syncFromHash();
      window.addEventListener('hashchange', syncFromHash);
      onCleanup(() => window.removeEventListener('hashchange', syncFromHash));
    });

    // Reset activeId only when the main category actually changes (skip initial run)
    let initialized = false;
    effect(() => {
      this.menuService.selectedMainCategoryId();
      if (initialized) {
        this.activeId = '';
      } else {
        initialized = true;
      }
    });
  }

  setActive(id: string) {
    this.activeId = id;
    // We could use an emitter here if we wanted to trigger the highlight manually,
    // but the effect in MenuListComponent watching the fragment should handle it.
  }
}
