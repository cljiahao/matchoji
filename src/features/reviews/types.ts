import type { PrepMethod, TasteAttribute } from './lib/tasting-vocab';

export interface ReviewPrep {
  method: PrepMethod | null;
  doseG: number | null;
  waterMl: number | null;
  waterTempC: number | null;
}

export interface Review {
  id: string;
  productId: string;
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
}
