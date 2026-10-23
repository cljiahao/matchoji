import type { ProductCategory, SupplyLevel } from '@/integrations/supabase/database.types';

export type { ProductCategory };

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: ProductCategory;
  grade: string | null;
  regionName: string | null;
  // How scarce this tea's category is in its region; null without a region or a sourced level.
  supply: SupplyLevel | null;
  imageUrl: string | null;
  createdAt: string;
  avgStars: number | null;
  reviewCount: number;
  // The feed's two most-noticed flavour notes; empty where not loaded or unrated.
  topNotes: string[];
}

export interface ProductSummary {
  id: string;
  name: string;
  brand: string | null;
  category: ProductCategory;
}
