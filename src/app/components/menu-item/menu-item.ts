import {
  Component,
  input,
  inject,
  computed,
  signal,
  effect,
  ElementRef,
  viewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/menu.model';
import { MenuService } from '../../services/menu.service';
import { OrderSelectionService } from '../../services/order-selection.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate-pipe';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [CommonModule, TranslatePipe, CurrencyFormatPipe],
  templateUrl: './menu-item.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './menu-item.css',
})
export class MenuItemComponent implements AfterViewInit {
  item = input.required<Product>();

  private readonly menuService = inject(MenuService);
  public readonly orderSelection = inject(OrderSelectionService);
  public readonly languageService = inject(LanguageService);

  private readonly prodImg = viewChild<ElementRef<HTMLImageElement>>('prodImg');

  public readonly imgLoaded = signal<boolean>(false);
  public readonly imgError = signal<boolean>(false);

  quantity = computed(() => this.orderSelection.getQuantity(this.item().id));
  note = computed(() => this.orderSelection.getNote(this.item().id));

  constructor() {
    let lastPhoto = '';
    effect(() => {
      const photo = this.item().photoUrl || '';
      if (photo !== lastPhoto) {
        lastPhoto = photo;
        this.imgLoaded.set(false);
        this.imgError.set(!photo);
        queueMicrotask(() => this.syncCachedImageState());
      }
    });
  }

  ngAfterViewInit(): void {
    this.syncCachedImageState();
  }

  private syncCachedImageState(): void {
    const imgEl = this.prodImg()?.nativeElement;
    if (!imgEl) return;
    if (imgEl.complete) {
      if (imgEl.naturalWidth > 0) {
        this.imgLoaded.set(true);
      } else {
        this.imgError.set(true);
      }
    }
  }

  openDetails(): void {
    this.menuService.setSelectedProduct(this.item());
  }

  increment(event: Event): void {
    event.stopPropagation();
    this.orderSelection.increment(this.item().id);
  }

  decrement(event: Event): void {
    event.stopPropagation();
    this.orderSelection.decrement(this.item().id);
  }

  onImgLoad(): void {
    this.imgLoaded.set(true);
  }

  onImgError(): void {
    this.imgError.set(true);
    this.imgLoaded.set(false);
  }
}
