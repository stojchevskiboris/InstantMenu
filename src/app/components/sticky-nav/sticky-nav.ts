import { Component, inject } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sticky-nav',
  imports: [CommonModule],
  templateUrl: './sticky-nav.html',
  styleUrl: './sticky-nav.css',
})
export class StickyNavComponent {
  private menuService = inject(MenuService);
  subCategories = () => this.menuService.currentMainCategory()?.subCategories || [];
  activeId = '';

  setActive(id: string) {
    this.activeId = id;
  }
}
