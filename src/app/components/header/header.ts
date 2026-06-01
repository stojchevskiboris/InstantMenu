import { Component, inject, computed } from '@angular/core';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  private menuService = inject(MenuService);
  venue = computed(() => this.menuService.menuData().venue);
}
