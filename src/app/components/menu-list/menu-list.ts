import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { MenuItemComponent } from '../menu-item/menu-item';

@Component({
  selector: 'app-menu-list',
  imports: [CommonModule, MenuItemComponent],
  templateUrl: './menu-list.html',
  styleUrl: './menu-list.css',
})
export class MenuListComponent {
  private menuService = inject(MenuService);
  subCategories = () => this.menuService.currentMainCategory()?.subCategories || [];
}
