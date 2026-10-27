import type {
  ProductCategory,
  ProductStatus,
  SupplyLevel,
} from '@/integrations/supabase/database.types';

import type { TeaPrice } from './lib/pricing';

export type { ProductCategory, ProductStatus };

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
  // The tea's page on its maker's own shop, where people check stock.
  shopUrl: string | null;
  // Teas added by tasters stay 'pending' until an admin reviews them; see the review-queue
  // migration. Lists and search show approved teas only.
  status: ProductStatus;
  // Who suggested the tea; lets its page offer rating to them while it awaits review.
  addedBy: string | null;
  // Why a tea was rejected, shown to whoever added it; and, for a merged duplicate, the tea
  // its page forwards to.
  reviewNote: string | null;
  mergedInto: string | null;
  createdAt: string;
  avgStars: number | null;
  reviewCount: number;
  // The feed's two most-noticed flavour notes; empty where not loaded or unrated.
  topNotes: string[];
  // Reference price, per gram and its band; null until an admin prices the tea.
  price: TeaPrice | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  brand: string | null;
  category: ProductCategory;
  // Read only where a list can include teas outside the catalogue (journal, want-to-try).
  status?: ProductStatus;
}
