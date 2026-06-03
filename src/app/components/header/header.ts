import { Component, inject, computed } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { ThemeService } from '../../services/theme.service';
import { CommonModule } from '@angular/common';
import { LanguageSelector } from "../language-selector/language-selector";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LanguageSelector],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  private menuService = inject(MenuService);
  public themeService = inject(ThemeService);
  venue = computed(() => this.menuService.menuData().venue);
}
