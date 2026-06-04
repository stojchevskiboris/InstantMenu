import { Component, inject } from '@angular/core';
import { HeaderComponent } from "./components/header/header";
import { CategoryToggleComponent } from "./components/category-toggle/category-toggle";
import { StickyNavComponent } from "./components/sticky-nav/sticky-nav";
import { MenuListComponent } from "./components/menu-list/menu-list";
import { OrderComponent } from "./components/order/order";
import { ItemDetailsModalComponent } from './components/item-details-modal/item-details-modal';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    CategoryToggleComponent,
    StickyNavComponent,
    MenuListComponent,
    OrderComponent,
    ItemDetailsModalComponent
],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private themeService = inject(ThemeService);
}
