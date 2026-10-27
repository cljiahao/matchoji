import type { ProductCategory } from '@/features/products';

// A catalogue tea with the admin-edited links, so the links form can show what is saved.
export interface CatalogueTea {
  id: string;
  name: string;
  brand: string | null;
  category: ProductCategory;
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
