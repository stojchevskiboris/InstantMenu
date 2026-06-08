import { Component, inject, computed, OnInit } from '@angular/core';
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
export class HeaderComponent implements OnInit {
  private menuService = inject(MenuService);
  public themeService = inject(ThemeService);
  public languageService = inject(LanguageService);

  venue = computed(() => this.menuService.menuData().venue);

  languages = this.languageService.languages;
  currentLang = this.languageService.currentLang;
  uiWords = this.languageService.uiWords;

  isVenueOpen: boolean = true;

  ngOnInit() {
    this.checkIfVenueIsOpen();
  }

  checkIfVenueIsOpen() {
    const openHour = this.venue().openHour;
    const closeHour = this.venue().closeHour;

    if (openHour != null && closeHour != null) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const parseTimeToMinutes = (timeString: string): number => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const openMinutes = parseTimeToMinutes(openHour);
      const closeMinutes = parseTimeToMinutes(closeHour);

      if (closeMinutes < openMinutes) {
        this.isVenueOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
      } else {
        this.isVenueOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
      }
    }
  }

  switchLanguage(lang: string) {
    this.languageService.switchLanguage(lang);
  }
}
