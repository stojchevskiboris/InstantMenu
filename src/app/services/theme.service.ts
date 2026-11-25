import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'lounge_menu_theme';
  private readonly themeSignal = signal<Theme>(this.resolveInitialTheme());

  public readonly theme = this.themeSignal.asReadonly();

  constructor() {
    effect(() => {
      const currentTheme = this.themeSignal();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', currentTheme);
        document.documentElement.setAttribute('data-bs-theme', currentTheme);
        this.updateFavicon(currentTheme);
      }
    });
  }

  public toggleTheme(): void {
    const next: Theme = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  public setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    this.persistManualPreference(theme);
  }

  public resolveInitialTheme(now: Date = new Date()): Theme {
    const savedTheme = this.readManualPreference();
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    // Default to Dark Mode between 19:00 and 05:00 local time
    const hour = now.getHours();
    if (hour >= 19 || hour < 5) {
      return 'dark';
    }

    // Otherwise match OS prefers-color-scheme: dark
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const darkModeMql = window.matchMedia('(prefers-color-scheme: dark)');
      if (darkModeMql.matches) {
        return 'dark';
      }
    }

    return 'light';
  }

  private readManualPreference(): string | null {
    try {
      return localStorage.getItem(this.THEME_KEY);
    } catch {
      return null;
    }
  }

  private persistManualPreference(theme: Theme): void {
    try {
      localStorage.setItem(this.THEME_KEY, theme);
    } catch {
      // Ignore storage errors in restricted browsing modes
    }
  }

  private updateFavicon(theme: Theme): void {
    const favicon = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = theme === 'dark' ? 'assets/favicon-dark.ico' : 'assets/favicon.ico';
    }
  }
}
