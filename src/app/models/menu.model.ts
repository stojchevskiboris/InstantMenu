export interface VenueInfo {
  name: { [key: string]: string };
  logoUrl: string;
  wifiPassword?: string;
  hours: { [key: string]: string };
  address: { [key: string]: string };
  phone: string;
}

export interface Product {
  id: string;
  name: { [key: string]: string };
  description: { [key: string]: string };
  price: number;
  photoUrl: string;
  tags?: string[];
}

export interface SubCategory {
  id: string;
  name: { [key: string]: string };
  items: Product[];
}

export interface MainCategory {
  id: string;
  name: { [key: string]: string };
  subCategories: SubCategory[];
}

export interface MenuData {
  venue: VenueInfo;
  categories: MainCategory[];
}

export interface OrderState {
  [productId: string]: number;
}
