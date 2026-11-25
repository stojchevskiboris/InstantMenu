import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeService } from './services/theme.service';
import { OrderSelectionService } from './services/order-selection.service';
import { MenuService } from './services/menu.service';
import { LanguageService } from './services/language.service';
import { App } from './app';

describe('InstantMenu Redesign Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    // Provide a stub matchMedia for jsdom
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  describe('ThemeService (Smart Default & Persistence)', () => {
    it('defaults to dark mode during evening/night hours (19:00 - 05:00) without writing to localStorage', () => {
      const service = TestBed.inject(ThemeService);
      expect(service.resolveInitialTheme(new Date('2026-11-25T21:15:00'))).toBe('dark');
      expect(service.resolveInitialTheme(new Date('2026-11-25T02:30:00'))).toBe('dark');
      expect(service.resolveInitialTheme(new Date('2026-11-25T13:00:00'))).toBe('light');
      expect(localStorage.getItem('lounge_menu_theme')).toBeNull();
    });

    it('persists manual theme toggle to localStorage and respects saved preference', () => {
      const service = TestBed.inject(ThemeService);
      service.setTheme('dark');
      expect(localStorage.getItem('lounge_menu_theme')).toBe('dark');
      expect(service.resolveInitialTheme(new Date('2026-11-25T12:00:00'))).toBe('dark');
    });
  });

  describe('OrderSelectionService (Signals + Venue localStorage)', () => {
    it('tracks quantities, notes, waiter checklist, totals, and persists by venue key', () => {
      const orderService = TestBed.inject(OrderSelectionService);
      expect(orderService.totalItems()).toBe(0);

      // Draft note before adding item
      orderService.updateNote('d1', 'No sugar');
      orderService.increment('d1'); // Double Espresso (200)
      orderService.increment('d1'); // qty = 2 -> 400
      orderService.increment('f1'); // Brunch Baguette (290) -> total = 690

      expect(orderService.totalItems()).toBe(3);
      expect(orderService.totalPrice()).toBe(690);
      expect(orderService.getNote('d1')).toBe('No sugar');

      orderService.toggleChecked('d1');
      expect(orderService.checkedCount()).toBe(1);

      TestBed.flushEffects();
      const stored = localStorage.getItem('instant_menu_order_the-velvet-lounge');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed['d1'].quantity).toBe(2);
      expect(parsed['d1'].note).toBe('No sugar');
      expect(parsed['d1'].checked).toBe(true);

      orderService.clearOrder();
      TestBed.flushEffects();
      expect(orderService.totalItems()).toBe(0);
      expect(localStorage.getItem('instant_menu_order_the-velvet-lounge')).toBeNull();
    });
  });

  describe('MenuService (Cross-Category Instant Search & Tag Filters)', () => {
    it('searches across Drinks and Food simultaneously and resets cleanly', () => {
      const menuService = TestBed.inject(MenuService);
      expect(menuService.isFilterMode()).toBe(false);

      // "tiramisu" exists in Drinks (Tiramisu Espresso) AND Food (Tiramisu Cake Small/Large)
      menuService.setSearchQuery('tiramisu');
      expect(menuService.isFilterMode()).toBe(true);
      const groups = menuService.filteredCategoryGroups();
      expect(groups.length).toBe(2);
      expect(menuService.totalFilteredMatches()).toBeGreaterThanOrEqual(3);

      menuService.setSearchQuery('xyznonexistent123');
      expect(menuService.totalFilteredMatches()).toBe(0);

      menuService.resetSearchAndFilters();
      expect(menuService.isFilterMode()).toBe(false);
    });

    it('filters by tag chips across categories', () => {
      const menuService = TestBed.inject(MenuService);
      expect(menuService.availableTags()).toContain('popular');

      menuService.selectTag('popular');
      expect(menuService.isFilterMode()).toBe(true);
      expect(menuService.filteredCategoryGroups().length).toBe(2);
    });
  });

  describe('App Component UI Integration', () => {
    it('renders sticky search, inline card steppers, floating order bar, and waiter mode drawer', () => {
      const langService = TestBed.inject(LanguageService);
      langService.switchLanguage('en');

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const root: HTMLElement = fixture.nativeElement;

      // Sticky search input exists
      const searchInput = root.querySelector<HTMLInputElement>('app-search-bar input[type="search"]');
      expect(searchInput).toBeTruthy();

      // Add button on first card morphs into stepper and reveals floating order bar
      const firstAddBtn = root.querySelector<HTMLButtonElement>('.btn-add-pill');
      expect(firstAddBtn).toBeTruthy();
      firstAddBtn!.click();
      fixture.detectChanges();

      // Trash icon shown when qty === 1
      expect(root.querySelector('.stepper-pill .bi-trash3')).toBeTruthy();
      expect(root.querySelector('.qty-corner-badge')?.textContent?.trim()).toBe('×1');

      // Floating My Order bar appears
      const floatingBar = root.querySelector<HTMLButtonElement>('.floating-order-bar');
      expect(floatingBar).toBeTruthy();

      // Open drawer and toggle Waiter Mode
      floatingBar!.click();
      fixture.detectChanges();
      const waiterBtn = root.querySelector<HTMLButtonElement>('.btn-waiter-toggle');
      expect(waiterBtn).toBeTruthy();
      waiterBtn!.click();
      fixture.detectChanges();

      expect(root.querySelectorAll('.waiter-checkbox').length).toBe(1);
    });
  });
});
