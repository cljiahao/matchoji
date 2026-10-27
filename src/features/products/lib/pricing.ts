import type { PriceBand, ProductCategory } from '@/integrations/supabase/database.types';

export type { PriceBand };

export interface TeaPrice {
  // One pack's reference price in Singapore dollars.
  sgd: number;
  packGrams: number;
  perGram: number;
  // Null until enough teas of the category are priced to compare against.
  band: PriceBand | null;
}

export const PRICE_BAND_LABELS: Record<PriceBand, string> = {
  budget: 'Budget',
  mid: 'Mid-range',
  premium: 'Premium',
};

// The doses the Learn recipes use, so "per cup" means the same thing on every page.
export const CUP_DOSES: Record<ProductCategory, { label: string; grams: number }[]> = {
  matcha: [
    { label: 'usucha', grams: 2 },
    { label: 'koicha', grams: 4 },
  ],
  hojicha: [{ label: 'cup', grams: 3 }],
};

// numeric columns can arrive as strings from PostgREST.
export function toTeaPrice(row: {
  price_sgd?: number | string | null;
  pack_grams?: number | string | null;
  price_band?: PriceBand | null;
}): TeaPrice | null {
  if (row.price_sgd === null || row.price_sgd === undefined) return null;
  if (row.pack_grams === null || row.pack_grams === undefined) return null;
  const sgd = Number(row.price_sgd);
  const packGrams = Number(row.pack_grams);
  return { sgd, packGrams, perGram: sgd / packGrams, band: row.price_band ?? null };
}

export function formatSgd(amount: number): string {
  return `S$${amount.toFixed(2)}`;
}

export function formatGrams(grams: number): string {
  return `${Number.isInteger(grams) ? grams : grams.toFixed(1)} g`;
}
