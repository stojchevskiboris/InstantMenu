import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'lounge_menu_theme';
  private themeSignal = signal<Theme>(this.getInitialTheme());

  public readonly theme = this.themeSignal.asReadonly();

  constructor() {
    effect(() => {
      const currentTheme = this.themeSignal();
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem(this.THEME_KEY, currentTheme);
      this.updateFavicon(currentTheme);
    });
  }

  public toggleTheme(): void {
    this.themeSignal.update(t => t === 'light' ? 'dark' : 'light');
  }

  public setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
  }

  private getInitialTheme(): Theme {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme | null;
    if (savedTheme) {
      return savedTheme;
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      const darkModeMql = window.matchMedia('(prefers-color-scheme: dark)');
      return darkModeMql.matches ? 'dark' : 'light';
    }

    return 'light';
  }

  private updateFavicon(theme: Theme): void {
    const favicon = document.getElementById('app-favicon') as HTMLLinkElement;
    if (favicon) {
      favicon.href = theme === 'dark' ? 'assets/favicon-dark.ico' : 'assets/favicon.ico';
    }
  }
}