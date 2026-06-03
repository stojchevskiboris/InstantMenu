import { CommonModule } from '@angular/common';
import { Component, inject, signal, effect } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { MenuItemComponent } from '../menu-item/menu-item';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [CommonModule, MenuItemComponent],
  templateUrl: './menu-list.html',
  styleUrl: './menu-list.css',
})
export class MenuListComponent {
  private menuService = inject(MenuService);
  public languageService = inject(LanguageService);

  subCategories = () => this.menuService.currentMainCategory()?.subCategories || [];

  highlightedId = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const handler = () => {
        const fragment = window.location.hash.substring(1);
        if (fragment) {
          this.highlight(fragment);
        }
      };

      handler();
      window.addEventListener('hashchange', handler);
      onCleanup(() => window.removeEventListener('hashchange', handler));
    });
  }

  highlight(id: string) {
    this.highlightedId.set(id);
    setTimeout(() => {
      if (this.highlightedId() === id) {
        this.highlightedId.set(null);
      }
    }, 2000);
  }
}
