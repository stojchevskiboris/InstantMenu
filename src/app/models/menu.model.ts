export interface VenueInfo {
  name: string;
  logoUrl: string;
  wifiPassword?: string;
  hours: string;
  address: string;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  photoUrl: string;
  tags?: string[];
}

export interface SubCategory {
  id: string;
  name: string;
  items: Product[];
}

export interface MainCategory {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

export interface MenuData {
  venue: VenueInfo;
  categories: MainCategory[];
}

export interface OrderState {
  [productId: string]: number;
}
