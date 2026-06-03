import { LanguageService } from './language.service';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageService);
  });

  it('should translate objects correctly with default language', () => {
    const obj = { en: 'Hello', mk: 'Здраво' };
    expect(service.translateObj(obj)).toBe('Здраво');
  });

  it('should handle undefined objects', () => {
    expect(service.translateObj(undefined)).toBe('');
  });
});
