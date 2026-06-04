import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService } from '../../services/menu.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-item-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-details-modal.html',
  styleUrl: './item-details-modal.css',
})
export class ItemDetailsModalComponent {
  public menuService = inject(MenuService);
  public languageService = inject(LanguageService);

  close() {
    this.menuService.setSelectedProduct(null);
  }
}
