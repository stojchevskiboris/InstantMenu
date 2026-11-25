import {
  Component,
  inject,
  effect,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  viewChildren,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate-pipe';

@Component({
  selector: 'app-sticky-nav',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './sticky-nav.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './sticky-nav.css',
})
export class StickyNavComponent implements AfterViewInit, OnDestroy {
  public readonly menuService = inject(MenuService);
  private readonly hostEl: ElementRef<HTMLElement> = inject(ElementRef);

  private readonly navPills = viewChildren<ElementRef<HTMLButtonElement>>('navPill');
  private resizeObserver: ResizeObserver | null = null;
  private hasInitialRender = false;

  subCategories = () => this.menuService.currentMainCategory()?.subCategories || [];
  activeId = this.menuService.activeSubCategoryId;

  constructor() {
    effect(() => {
      const currentActive = this.activeId();
      const pills = this.navPills();
      if (!currentActive || pills.length === 0) return;

      if (!this.hasInitialRender) {
        this.hasInitialRender = true;
        return;
      }

      const matchingPill = pills.find(
        (ref) => ref.nativeElement.dataset['sectionId'] === currentActive
      );
      matchingPill?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    });
  }

  ngAfterViewInit(): void {
    this.syncNavHeight();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.syncNavHeight());
      this.resizeObserver.observe(this.hostEl.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private syncNavHeight(): void {
    const el = this.hostEl.nativeElement.firstElementChild as HTMLElement | null;
    const height = el ? el.offsetHeight : 0;
    if (height > 0 && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sticky-nav-height', `${height}px`);
    }
  }

  scrollToSection(sectionId: string): void {
    this.menuService.lockManualScroll(sectionId);
    const targetEl = document.getElementById(sectionId);
    if (!targetEl || typeof window === 'undefined') return;

    const rootStyles = getComputedStyle(document.documentElement);
    const searchH = parseFloat(rootStyles.getPropertyValue('--sticky-search-height')) || 98;
    const navH = parseFloat(rootStyles.getPropertyValue('--sticky-nav-height')) || 56;
    const offset = searchH + navH + 8;

    const top = targetEl.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth',
    });
  }
}
