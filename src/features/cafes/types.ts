import type { Review } from '@/features/reviews';
import type {
  CafeStatus,
  CityCountry,
  DrinkBase,
  DrinkCurrency,
  DrinkServing,
  DrinkStatus,
  DrinkStyle,
} from '@/integrations/supabase/database.types';

export type CitySlug = 'singapore' | 'johor-bahru';

export interface City {
  slug: CitySlug;
  name: string;
  country: CityCountry;
  currency: DrinkCurrency;
}

// Taster and community scores are separate on purpose and are never blended into one number.
// A disclosed review (gifted, paid or invited) still counts; the count is shown beside the score.
export interface ScorePair {
  tasterAvg: number | null;
  tasterCount: number;
  tasterDisclosedCount: number;
  communityAvg: number | null;
  communityCount: number;
}

export interface Cafe {
  id: string;
  slug: string;
  name: string;
  citySlug: string;
  area: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  instagramHandle: string | null;
  websiteUrl: string | null;
  status: CafeStatus;
}

export interface CafeListing extends Cafe {
  drinkCount: number;
  scores: ScorePair;
}

export interface Drink {
  id: string;
  cafeId: string;
  slug: string;
  name: string;
  base: DrinkBase;
  style: DrinkStyle;
  serving: DrinkServing;
  price: number | null;
  currency: DrinkCurrency;
  photoUrl: string | null;
  photoCredit: string | null;
  teaProductId: string | null;
  status: DrinkStatus;
}

export interface DrinkListing extends Drink {
  scores: ScorePair;
  cafe: { slug: string; name: string; area: string | null; citySlug: string };
}

// A merged or rejected page forwards instead of failing, so a link posted to Instagram never 404s.
export interface PageRedirect {
  kind: 'redirect';
  to: string;
}
export interface PageMissing {
  kind: 'missing';
}

export type CafePageResult =
  | { kind: 'found'; cafe: Cafe; scores: ScorePair; drinks: DrinkListing[] }
  | PageRedirect
  | PageMissing;

export type DrinkPageResult =
  | {
      kind: 'found';
      drink: DrinkListing;
      tasterReviews: Review[];
      communityReviews: Review[];
      teaProduct: { id: string; name: string } | null;
    }
  | PageRedirect
  | PageMissing;

export interface TasterDrinkReview {
  review: Review;
  drink: DrinkListing;
}

export interface CafeSitemapEntry {
  path: string;
  lastModified?: string;
}

// A /top drink list with at least one qualifying drink; `drinks` is only its first few.
export interface TopDrinkList {
  slug: string;
  title: string;
  city: CitySlug;
  base: DrinkBase;
  style: DrinkStyle;
  count: number;
  drinks: DrinkListing[];
}
