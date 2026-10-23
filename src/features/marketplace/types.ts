import type { ProductSummary } from '@/features/products';
import type { VendorStatus } from '@/integrations/supabase/database.types';

export type { VendorStatus };

export interface Vendor {
  id: string;
  name: string;
  profileInfo: string | null;
  website: string | null;
  // ISO 3166 alpha-2 codes, e.g. "JP".
  country: string;
  shipsTo: string[];
  status: VendorStatus;
  // The admin's reason, shown to the shop when its application is rejected.
  reviewNote: string | null;
}

export interface Listing {
  id: string;
  productId: string;
  price: number;
  // ISO 4217, e.g. "SGD".
  currency: string;
  stock: number;
  url: string;
  updatedAt: string;
}

export interface VendorListing extends Listing {
  product: ProductSummary | null;
}

// One approved vendor's listing of a tea, as shown under "Where to buy".
export interface ProductOffer extends Listing {
  vendor: Pick<Vendor, 'id' | 'name' | 'country' | 'shipsTo' | 'website'>;
}
