import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  effect,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { OrderSelectionService } from '../../services/order-selection.service';
import { MenuItemComponent } from '../menu-item/menu-item';
import { TranslatePipe } from '../../pipes/translate-pipe';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [CommonModule, MenuItemComponent, TranslatePipe],
  templateUrl: './menu-list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './menu-list.css',
})
export class MenuListComponent implements AfterViewInit, OnDestroy {
  public readonly menuService = inject(MenuService);
  public readonly orderSelection = inject(OrderSelectionService);
  private readonly hostEl: ElementRef<HTMLElement> = inject(ElementRef);

  private observer: IntersectionObserver | null = null;
  private rafPending = false;
  private onScrollBound = () => this.scheduleActiveSectionSync();

  subCategories = () => this.menuService.currentMainCategory()?.subCategories || [];

  constructor() {
    effect(() => {
      this.menuService.selectedMainCategoryId();
      const filtering = this.menuService.isFilterMode();
      if (filtering) {
        this.disconnectObserver();
      } else {
        setTimeout(() => this.setupScrollSpy(), 50);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.menuService.isFilterMode()) {
      this.setupScrollSpy();
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onScrollBound, { passive: true });
    }
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScrollBound);
    }
  }

  private disconnectObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private setupScrollSpy(): void {
    this.disconnectObserver();
    if (typeof IntersectionObserver === 'undefined') return;

    const sections = Array.from(
      this.hostEl.nativeElement.querySelectorAll<HTMLElement>('.category-section[id^="sub-"]')
    );
    if (sections.length === 0) return;

    this.observer = new IntersectionObserver(
      () => {
        if (!this.menuService.isManualScrolling()) {
          this.syncActiveSectionFromViewport();
        }
      },
      {
        root: null,
        rootMargin: '-150px 0px -50% 0px',
        threshold: [0, 0.05, 0.15, 0.3],
      }
    );

    sections.forEach((sec) => this.observer!.observe(sec));
  }

  private scheduleActiveSectionSync(): void {
    if (this.rafPending || this.menuService.isFilterMode() || this.menuService.isManualScrolling()) {
      return;
    }
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      this.syncActiveSectionFromViewport();
    });
  }

  private syncActiveSectionFromViewport(): void {
    if (this.menuService.isFilterMode() || this.menuService.isManualScrolling()) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const sections = Array.from(
      this.hostEl.nativeElement.querySelectorAll<HTMLElement>('.category-section[id^="sub-"]')
    );
    if (sections.length === 0) return;

    if (window.scrollY < 30) {
      this.updateActiveIfChanged(sections[0].id);
      return;
    }

    const nearBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24;
    if (nearBottom) {
      this.updateActiveIfChanged(sections[sections.length - 1].id);
      return;
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const searchH = parseFloat(rootStyles.getPropertyValue('--sticky-search-height')) || 98;
    const navH = parseFloat(rootStyles.getPropertyValue('--sticky-nav-height')) || 56;
    const triggerLine = searchH + navH + 28;

    let activeCandidate = sections[0].id;
    for (const sec of sections) {
      if (sec.getBoundingClientRect().top <= triggerLine) {
        activeCandidate = sec.id;
      } else {
        break;
      }
    }

    this.updateActiveIfChanged(activeCandidate);
  }

  private updateActiveIfChanged(sectionId: string): void {
    if (this.menuService.activeSubCategoryId() !== sectionId) {
      this.menuService.activeSubCategoryId.set(sectionId);
    }
  }

  resetSearch(): void {
    this.menuService.resetSearchAndFilters();
  }
}
