import { Component } from '@angular/core';
import { HeaderComponent } from './components/header.component';
import { CategoryToggleComponent } from './components/category-toggle.component';
import { StickyNavComponent } from './components/sticky-nav.component';
import { MenuListComponent } from './components/menu-list.component';

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
