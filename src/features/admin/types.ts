import type { ProductCategory } from '@/features/products';

// A catalogue tea with the admin-edited links, so the links form can show what is saved.
export interface CatalogueTea {
  id: string;
  name: string;
  brand: string | null;
  category: ProductCategory;
  imageUrl: string | null;
  imageCredit: string | null;
  shopUrl: string | null;
}

export interface PendingTea {
  id: string;
  name: string;
  brand: string | null;
  category: ProductCategory;
  grade: string | null;
  createdAt: string;
  addedByName: string | null;
}

export interface PendingShop {
  id: string;
  name: string;
  country: string;
  shipsTo: string[];
  website: string | null;
  profileInfo: string | null;
  createdAt: string;
}

export interface ReviewQueue {
  teas: PendingTea[];
  shops: PendingShop[];
}

export type ReviewDecision = 'approved' | 'rejected';

export interface AdminCafe {
  id: string;
  name: string;
  citySlug: string;
  area: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  instagramHandle: string | null;
  websiteUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  addedByName: string | null;
}

export interface AdminDrink {
  id: string;
  cafeId: string;
  cafeName: string;
  name: string;
  base: 'hojicha' | 'matcha';
  style: 'latte' | 'straight' | 'iced_latte' | 'float' | 'other';
  serving: 'hot' | 'iced' | 'both';
  price: number | null;
  photoUrl: string | null;
  photoCredit: string | null;
  teaProductId: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  addedByName: string | null;
}

// Found through public_profiles, which lists private profiles too (it hides only their bio and
// handle), so an admin can badge a taster who has not made their profile public yet.
export interface AdminProfile {
  id: string;
  displayName: string;
  isPublic: boolean;
  isTrustedTaster: boolean;
}
