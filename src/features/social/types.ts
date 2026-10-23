import type { ProductSummary } from '@/features/products';
import type { Review } from '@/features/reviews';

export interface PublicProfile {
  id: string;
  name: string;
  isPublic: boolean;
  joinedAt: string;
}

export interface Tasting extends Review {
  product: ProductSummary;
}

export interface ProfileView {
  profile: PublicProfile;
  counts: { teas: number; followers: number; following: number };
  viewer: { isSelf: boolean; follows: boolean; blocked: boolean };
  // Newest first; empty for a private profile seen by someone else.
  recent: Tasting[];
}
