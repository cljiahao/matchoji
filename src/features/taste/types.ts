import type { ProductCategory } from '@/features/products';
import type { TasteAttribute } from '@/features/reviews';

// What a tea is like, from its catalogue entry and the community's latest tastings.
export interface TeaFeatures {
  id: string;
  name: string;
  category: ProductCategory;
  // Normalised (trimmed, lower case) so "Ceremonial" and "ceremonial " compare equal.
  grade: string | null;
  regionId: string | null;
  // Average of the community's sliders (1-5); missing where nobody recorded one.
  sliders: Partial<Record<TasteAttribute, number>>;
  // How many tasters mentioned each flavour note.
  notes: Record<string, number>;
}

export interface RatedTea {
  tea: TeaFeatures;
  stars: number;
}

export type MatchBand = 'great' | 'average' | 'low';

export interface MatchResult {
  // Chance, as a percentage, that this taster rates the tea 4★ or more.
  score: number;
  band: MatchBand;
  // The taster's own ratings that drove the score, most influential first.
  because: { name: string; stars: number }[];
}
