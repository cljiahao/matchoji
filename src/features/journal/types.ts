import type { ProductSummary } from '@/features/products';
import type { Review } from '@/features/reviews';

export interface JournalEntry extends Review {
  product: ProductSummary;
}

export interface JournalStats {
  count: number;
  avgStars: number | null;
  split: { matcha: number; hojicha: number };
  topNotes: string[];
}
