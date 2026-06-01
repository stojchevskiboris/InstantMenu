import { Component } from '@angular/core';
import { HeaderComponent } from "./components/header/header";
import { CategoryToggleComponent } from "./components/category-toggle/category-toggle";
import { StickyNavComponent } from "./components/sticky-nav/sticky-nav";
import { MenuListComponent } from "./components/menu-list/menu-list";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    CategoryToggleComponent,
    StickyNavComponent,
    MenuListComponent
],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
