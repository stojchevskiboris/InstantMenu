import { TestBed } from '@angular/core/testing';
import { MenuService } from './menu.service';

describe('MenuService', () => {
  let service: MenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuService);
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default category as drink', () => {
    expect(service.selectedMainCategoryId()).toBe('drink');
  });

  it('should update quantity correctly', () => {
    service.updateQuantity('d1', 1);
    expect(service.getQuantity('d1')).toBe(1);

    service.updateQuantity('d1', 2);
    expect(service.getQuantity('d1')).toBe(3);

    service.updateQuantity('d1', -1);
    expect(service.getQuantity('d1')).toBe(2);
  });

  it('should not allow negative quantity', () => {
    service.updateQuantity('d1', -1);
    expect(service.getQuantity('d1')).toBe(0);
  });
});
