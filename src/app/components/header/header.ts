import { Component, inject, computed } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService } from '../../services/language.service';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate-pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  private menuService = inject(MenuService);
  public themeService = inject(ThemeService);
  public languageService = inject(LanguageService);

  venue = computed(() => this.menuService.menuData().venue);

  languages = this.languageService.languages;
  currentLang = this.languageService.currentLang;
  uiWords = this.languageService.uiWords;

  switchLanguage(lang: string) {
    this.languageService.switchLanguage(lang);
  }
}
