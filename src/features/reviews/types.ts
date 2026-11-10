import type { Disclosure, DrinkBase } from '@/integrations/supabase/database.types';

import type { FlushName, PrepMethod, TasteAttribute } from './lib/tasting-vocab';

export type { Disclosure };

export interface ReviewPrep {
  method: PrepMethod | null;
  doseG: number | null;
  waterMl: number | null;
  waterTempC: number | null;
}

export interface Review {
  id: string;
  // A review is of a tea (productId) or of a café drink (drinkId), never both.
  productId: string | null;
  drinkId: string | null;
  reviewerName: string;
  // The author's profile id, for linking to their profile; null once they deleted their account.
  authorId: string | null;
  stars: number;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
  flavorNotes: string[];
  // Only attributes the taster actually set, so averages skip the rest.
  profile: Partial<Record<TasteAttribute, number>>;
  prep: ReviewPrep;
  tastedOn: string;
  // Which harvest it was, when the taster said (tea's equivalent of a wine's vintage).
  edition: { harvestYear: number | null; flush: FlushName | null };
  // Whether the author held the trusted-taster badge when they wrote it.
  byTrustedTaster: boolean;
  instagramUrl: string | null;
  disclosure: Disclosure;
  // Drink reviews only: how much the tea comes through the milk, and (hojicha) roast depth.
  teaStrength: number | null;
  roast: number | null;
}

// A café drink with its café, enough to name it and link to its page.
export interface DrinkSummary {
  id: string;
  slug: string;
  name: string;
  base: DrinkBase;
  cafe: { id: string; slug: string; name: string };
}

// Brew settings a recipe hands to the tasting form.
export interface PrepPreset {
  method: PrepMethod;
  doseG: number;
  waterMl: number;
  waterTempC: number;
}
