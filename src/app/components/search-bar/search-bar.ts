import {
  Component,
  inject,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  viewChild,
  viewChildren,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService } from '../../services/menu.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate-pipe';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './search-bar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './search-bar.css',
})
export class SearchBarComponent implements AfterViewInit, OnDestroy {
  public readonly menuService = inject(MenuService);
  public readonly languageService = inject(LanguageService);
  private readonly hostEl: ElementRef<HTMLElement> = inject(ElementRef);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly chipButtons = viewChildren<ElementRef<HTMLButtonElement>>('filterChip');

  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.syncHeightVar();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.syncHeightVar());
      this.resizeObserver.observe(this.hostEl.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private syncHeightVar(): void {
    const el = this.hostEl.nativeElement.firstElementChild as HTMLElement | null;
    const height = el ? el.offsetHeight : this.hostEl.nativeElement.offsetHeight;
    if (height > 0 && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sticky-search-height', `${height}px`);
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.menuService.setSearchQuery(value);
  }

  clearQuery(): void {
    this.menuService.clearSearchQuery();
    this.searchInput()?.nativeElement.focus();
  }

  selectFilterTag(tag: string, index: number): void {
    this.menuService.selectTag(tag);
    const chip = this.chipButtons()[index]?.nativeElement;
    chip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
}
