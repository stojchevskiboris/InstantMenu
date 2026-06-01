import { Component, inject, input } from '@angular/core';
import { Product } from '../models/menu.model';
import { MenuService } from '../services/menu.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card mb-3 overflow-hidden">
      <div class="row g-0 align-items-center">
        <div class="col-8 p-3">
          <div class="d-flex gap-1 mb-1 flex-wrap">
            @for (tag of item().tags; track tag) {
              <span class="badge bg-warning text-dark border-0 x-small px-2 py-1 rounded-pill">{{ tag }}</span>
            }
          </div>
          <h6 class="mb-1 fw-bold text-dark">{{ item().name }}</h6>
          <p class="text-muted small mb-2 line-clamp-2" style="font-size: 0.8rem;">{{ item().description }}</p>
          <div class="d-flex align-items-center justify-content-between mt-auto">
            <span class="fw-bold text-dark">{{ item().price | currency }}</span>

            <div class="d-flex align-items-center ms-2">
              @if (quantity() > 0) {
                <div class="d-flex align-items-center bg-light rounded-pill p-1 border">
                  <button class="btn btn-sm btn-white rounded-circle shadow-sm" (click)="decrement($event)">
                    <span class="small fw-bold">-</span>
                  </button>
                  <span class="mx-2 fw-bold small" style="min-width: 20px; text-align: center;">{{ quantity() }}</span>
                  <button class="btn btn-sm btn-white rounded-circle shadow-sm" (click)="increment($event)">
                    <span class="small fw-bold">+</span>
                  </button>
                </div>
              } @else {
                <button class="btn btn-dark btn-sm rounded-pill px-3 py-1 fw-bold small" (click)="increment($event)">
                  Add
                </button>
              }
            </div>
          </div>
        </div>
        <div class="col-4 position-relative" style="height: 120px;">
          <div class="w-100 h-100 bg-light d-flex align-items-center justify-content-center text-muted small border-start">
            @if (item().photoUrl) {
              <img [src]="item().photoUrl" class="w-100 h-100 object-fit-cover" [alt]="item().name"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            }
            <div class="d-none w-100 h-100 align-items-center justify-content-center bg-light text-muted" style="font-size: 0.6rem;">
              {{ item().name }}
            </div>
            <span class="position-absolute bottom-0 start-0 m-1">
               <i class="bi bi-zoom-in text-white shadow-sm"></i>
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .x-small { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .btn-white {
      background: white;
      width: 28px;
      height: 28px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #dee2e6;
    }
    .btn-white:active { background: #f8f9fa; transform: scale(0.95); }
    .card { transition: transform 0.1s ease-in-out; border: 1px solid rgba(0,0,0,0.05); }
  `]
})
export class MenuItemComponent {
  private menuService = inject(MenuService);
  item = input.required<Product>();

  quantity = () => this.menuService.getQuantity(this.item().id);

  increment(event: Event) {
    event.stopPropagation();
    this.menuService.updateQuantity(this.item().id, 1);
  }

  decrement(event: Event) {
    event.stopPropagation();
    this.menuService.updateQuantity(this.item().id, -1);
  }
}
