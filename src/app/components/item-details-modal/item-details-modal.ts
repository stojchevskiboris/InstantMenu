import {
  Component,
  inject,
  signal,
  computed,
  effect,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService } from '../../services/menu.service';
import { OrderSelectionService } from '../../services/order-selection.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate-pipe';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-item-details-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe, CurrencyFormatPipe],
  templateUrl: './item-details-modal.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './item-details-modal.css',
})
export class ItemDetailsModalComponent {
  public readonly menuService = inject(MenuService);
  public readonly orderSelection = inject(OrderSelectionService);
  public readonly languageService = inject(LanguageService);

  public readonly imgLoaded = signal<boolean>(false);
  public readonly imgError = signal<boolean>(false);

  public readonly selectedItem = this.menuService.selectedProduct;

  public readonly quantity = computed<number>(() => {
    const prod = this.selectedItem();
    return prod ? this.orderSelection.getQuantity(prod.id) : 0;
  });

  public readonly currentNote = computed<string>(() => {
    const prod = this.selectedItem();
    return prod ? this.orderSelection.getNote(prod.id) : '';
  });

  public readonly quickNoteKeys = computed<string[]>(() => {
    const prod = this.selectedItem();
    if (!prod) return [];
    const catId = this.menuService.getProductCategoryId(prod.id);
    const subId = this.menuService.getProductSubCategoryId(prod.id);

    if (catId === 'food') {
      return ['chip_well_done', 'chip_no_sauce', 'chip_share_plates'];
    }
    if (subId === 'coffee') {
      return ['chip_cold_milk', 'chip_no_sugar', 'chip_oat_milk', 'chip_no_ice'];
    }
    return ['chip_no_ice', 'chip_less_ice', 'chip_extra_lemon'];
  });

  constructor() {
    let lastId = '';
    effect(() => {
      const prod = this.selectedItem();
      if (typeof document !== 'undefined') {
        document.body.classList.toggle(
          'sheet-open',
          Boolean(prod) || this.orderSelection.isDrawerOpen()
        );
      }

      const nextId = prod?.id || '';
      if (nextId !== lastId) {
        lastId = nextId;
        this.imgLoaded.set(false);
        this.imgError.set(!prod?.photoUrl);
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.selectedItem()) {
      this.close();
    }
  }

  close(): void {
    this.menuService.setSelectedProduct(null);
  }

  increment(): void {
    const prod = this.selectedItem();
    if (prod) {
      this.orderSelection.increment(prod.id);
    }
  }

  decrement(): void {
    const prod = this.selectedItem();
    if (prod) {
      this.orderSelection.decrement(prod.id);
    }
  }

  onPrimaryAction(): void {
    const prod = this.selectedItem();
    if (!prod) return;
    if (this.quantity() === 0) {
      this.orderSelection.setQuantity(prod.id, 1);
    }
    this.close();
  }

  onNoteInput(event: Event): void {
    const prod = this.selectedItem();
    if (!prod) return;
    const value = (event.target as HTMLInputElement).value;
    this.orderSelection.updateNote(prod.id, value);
  }

  clearNote(): void {
    const prod = this.selectedItem();
    if (prod) {
      this.orderSelection.updateNote(prod.id, '');
    }
  }

  isChipActive(chipKey: string): boolean {
    const label = this.languageService.translateUi(chipKey) || chipKey;
    const parts = this.currentNote()
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return parts.includes(label.toLowerCase());
  }

  toggleQuickChip(chipKey: string): void {
    const prod = this.selectedItem();
    if (!prod) return;
    const label = this.languageService.translateUi(chipKey) || chipKey;
    const existingParts = this.currentNote()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const idx = existingParts.findIndex((p) => p.toLowerCase() === label.toLowerCase());
    if (idx >= 0) {
      existingParts.splice(idx, 1);
    } else {
      existingParts.push(label);
    }

    this.orderSelection.updateNote(prod.id, existingParts.join(', '));
  }

  onImgLoad(): void {
    this.imgLoaded.set(true);
  }

  onImgError(): void {
    this.imgError.set(true);
    this.imgLoaded.set(false);
  }
}
