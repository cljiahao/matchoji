import type { ProductSummary } from '@/features/products';
import type { DrinkSummary, PrepMethod, Review, TasteAttribute } from '@/features/reviews';

// A tea tasting. Stats, the year recap and the taste profile only ever read these.
export interface JournalEntry extends Review {
  product: ProductSummary;
  regionName: string | null;
}

// A café-drink tasting; it has a drink and no tea.
export interface DrinkJournalEntry extends Review {
  drink: DrinkSummary;
}

// What the journal timeline lists: both kinds, newest first.
export type JournalItem = JournalEntry | DrinkJournalEntry;

export interface Ranked {
  name: string;
  count: number;
}

export interface JournalStats {
  count: number;
  // Distinct teas tasted; a tea logged twice counts once.
  teas: number;
  avgStars: number | null;
  split: { matcha: number; hojicha: number };
  topNotes: string[];
  // The "top" stats stay null until there are enough tastings for them to mean something.
  topMaker: Ranked | null;
  topRegion: Ranked | null;
  topPrep: PrepMethod | null;
  // Distinct days with a tasting this month, and the longest run of consecutive ones.
  tastingDays: number;
  streak: number;
}

// What a stranger may see on a public profile: counts of teas, never tastings or notes.
export interface PublicStats {
  teas: number;
  split: { matcha: number; hojicha: number };
  topRegion: Ranked | null;
}

export interface TasteShift {
  attribute: TasteAttribute;
  from: number;
  to: number;
  // The pole of the scale the average moved toward, e.g. "Sweet".
  toward: string;
}

export interface YearHighlight {
  tea: string;
  maker: string | null;
  date: string;
  stars: number;
}

export interface YearInTea {
  year: number;
  tastings: number;
  teas: number;
  split: { matcha: number; hojicha: number };
  avgStars: number;
  first: YearHighlight;
  latest: YearHighlight;
  topRated: YearHighlight;
  busiestMonth: { label: string; count: number };
  // A maker whose first tasting ever falls in this year; null when every maker was tried before.
  newestMaker: { maker: string; tea: string; date: string } | null;
  taste: {
    // False in a first year: there is no earlier profile to compare with.
    hasBaseline: boolean;
    shifts: TasteShift[];
    newNotes: string[];
    favouriteNotes: string[];
  };
}

// The share card's whole input. It is built from counts and tea names only, so a private
// note can never reach the image.
export interface YearCardData {
  taster: string;
  year: number;
  tastings: number;
  teas: number;
  split: { matcha: number; hojicha: number };
  topRated: { tea: string; stars: number };
  busiestMonth: string;
}
