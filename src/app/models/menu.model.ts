export interface VenueInfo {
  id?: string;
  name: { [key: string]: string };
  logoUrl: string;
  wifiPassword?: string;
  openHour?: string;
  closeHour?: string;
  address: { [key: string]: string };
  phone: string;
}

export interface Product {
  id: string;
  name: { [key: string]: string };
  description: { [key: string]: string };
  price: number;
  photoUrl: string;
  aliases?: string[];
  tags?: string[];
  volume?: string;
  abv?: string;
  allergens?: string[];
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

export interface SelectedOrderEntry {
  productId: string;
  quantity: number;
  note?: string;
  checked?: boolean;
}
