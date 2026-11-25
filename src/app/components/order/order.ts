import {
  Component,
  inject,
  signal,
  effect,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderSelectionService } from '../../services/order-selection.service';
import { MenuService } from '../../services/menu.service';
import { LanguageService } from '../../services/language.service';
import { Product } from '../../models/menu.model';
import { TranslatePipe } from '../../pipes/translate-pipe';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, TranslatePipe, CurrencyFormatPipe],
  templateUrl: './order.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './order.css',
})
export class OrderComponent {
  public readonly orderSelection = inject(OrderSelectionService);
  public readonly menuService = inject(MenuService);
  public readonly languageService = inject(LanguageService);

  public readonly confirmingClear = signal<boolean>(false);
  public readonly failedThumbs = signal<Record<string, boolean>>({});
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const open = this.orderSelection.isDrawerOpen();
      if (typeof document !== 'undefined') {
        document.body.classList.toggle(
          'sheet-open',
          open || Boolean(this.menuService.selectedProduct())
        );
      }
      if (!open) {
        this.cancelClearConfirmation();
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.orderSelection.isDrawerOpen() && !this.menuService.selectedProduct()) {
      this.closeDrawer();
    }
  }

  openDrawer(): void {
    this.orderSelection.openDrawer();
  }

  closeDrawer(): void {
    this.orderSelection.closeDrawer();
  }

  toggleWaiterMode(): void {
    this.orderSelection.toggleWaiterMode();
  }

  increment(productId: string): void {
    this.orderSelection.increment(productId);
  }

  decrement(productId: string): void {
    this.orderSelection.decrement(productId);
  }

  toggleChecked(productId: string): void {
    this.orderSelection.toggleChecked(productId);
  }

  editItemNote(product: Product): void {
    this.orderSelection.closeDrawer();
    this.menuService.setSelectedProduct(product);
  }

  requestClearConfirmation(): void {
    this.confirmingClear.set(true);
    if (this.clearTimer) clearTimeout(this.clearTimer);
    this.clearTimer = setTimeout(() => {
      this.confirmingClear.set(false);
    }, 5000);
  }

  cancelClearConfirmation(): void {
    if (this.clearTimer) clearTimeout(this.clearTimer);
    this.confirmingClear.set(false);
  }

  confirmClearOrder(): void {
    this.cancelClearConfirmation();
    this.orderSelection.clearOrder();
  }

  onThumbError(productId: string): void {
    this.failedThumbs.update((prev) => ({ ...prev, [productId]: true }));
  }

  showLocalSubtitle(product: Product): boolean {
    const lang = this.languageService.currentLang();
    return Boolean(lang && lang !== 'mk' && product.name['mk'] && product.name['mk'] !== product.name[lang]);
  }
}
