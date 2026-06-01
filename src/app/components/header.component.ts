import { Component, inject, computed } from '@angular/core';
import { MenuService } from '../services/menu.service';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="p-3 border-bottom bg-white">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="d-flex align-items-center">
          <div class="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 45px; height: 45px;">
            {{ venue().name.charAt(0) }}
          </div>
          <div class="ms-3">
            <h1 class="h6 mb-0 fw-bold">{{ venue().name }}</h1>
            <div class="d-flex align-items-center">
              <span class="badge bg-success-subtle text-success border border-success-subtle small px-2 py-1" style="font-size: 0.65rem;">Open</span>
              <small class="text-muted ms-2" style="font-size: 0.75rem;">{{ venue().hours }}</small>
            </div>
          </div>
        </div>
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm border-0 bg-light rounded-pill" style="width: auto; font-size: 0.75rem;">
            <option value="en">EN</option>
            <option value="it">IT</option>
          </select>
          <button class="btn btn-light btn-sm rounded-circle shadow-sm" data-bs-toggle="collapse" data-bs-target="#infoPanel" style="width: 32px; height: 32px; padding: 0;">
            i
          </button>
        </div>
      </div>

      <div class="collapse" id="infoPanel">
        <div class="card card-body bg-light border-0 mb-3 small shadow-sm">
          <p class="mb-2"><strong><i class="bi bi-geo-alt"></i> Address:</strong> {{ venue().address }}</p>
          <p class="mb-2"><strong><i class="bi bi-telephone"></i> Phone:</strong> {{ venue().phone }}</p>
          <p class="mb-0"><strong><i class="bi bi-wifi"></i> Wi-Fi:</strong> {{ venue().wifiPassword }}</p>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  private menuService = inject(MenuService);
  venue = computed(() => this.menuService.menuData().venue);
}
