import { Component, inject } from '@angular/core';
import { LanguageService } from '../../services/language.service';
import { KeyValuePipe } from '@angular/common'; // <-- Import this for the pipe error

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [KeyValuePipe], 
  templateUrl: './language-selector.html',
  styleUrl: './language-selector.css',
})
export class LanguageSelector {
  public languageService = inject(LanguageService);

  languages = this.languageService.languages;
  currentLang = this.languageService.currentLang; 
  uiWords = this.languageService.uiWords;

  switchLanguage(lang: string) {
    this.languageService.switchLanguage(lang);
  }
}