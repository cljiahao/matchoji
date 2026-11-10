import type { ProductSummary } from '@/features/products';
import type { DrinkSummary, Review } from '@/features/reviews';

export interface PublicProfile {
  id: string;
  name: string;
  isPublic: boolean;
  joinedAt: string;
  isTrustedTaster: boolean;
  // Null unless the profile is public (the view blanks them) and the person filled them in.
  instagramHandle: string | null;
  bio: string | null;
}

export interface TeaTasting extends Review {
  product: ProductSummary;
}

export interface DrinkTasting extends Review {
  drink: DrinkSummary;
}

// The feed and profiles show both kinds; taste and counts read the tea ones only.
export type Tasting = TeaTasting | DrinkTasting;

export interface ProfileView {
  profile: PublicProfile;
  counts: { teas: number; drinks: number; followers: number; following: number };
  viewer: { isSelf: boolean; follows: boolean; blocked: boolean };
  // Newest first; empty for a private profile seen by someone else.
  recent: Tasting[];
  // The drink tastings among `recent`, kept apart so the page can lead with them.
  drinkReviews: DrinkTasting[];
}

export interface TasterCard {
  id: string;
  name: string;
  bio: string | null;
  instagramHandle: string | null;
  drinkReviewCount: number;
  latest: DrinkTasting | null;
}
