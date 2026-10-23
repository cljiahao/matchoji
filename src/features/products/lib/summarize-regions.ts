import type { ProductCategory } from '../types';
import { supplyRank, type SupplyLevel } from './supply';

export interface RegionSummary {
  id: string;
  name: string;
  prefecture: string | null;
  scarcityNote: string | null;
  supply: Record<ProductCategory, SupplyLevel | null>;
  counts: Record<ProductCategory, number>;
}

interface RegionInput {
  id: string;
  name: string;
  prefecture: string | null;
  scarcity_note: string | null;
  matcha_supply: SupplyLevel | null;
  hojicha_supply: SupplyLevel | null;
}

// Regions with the most teas lead, so the page opens on places people can actually explore;
// ties and empty regions fall back to name order.
export function summarizeRegions(
  regions: RegionInput[],
  products: { region_id: string | null; category: ProductCategory }[]
): RegionSummary[] {
  const summaries = new Map<string, RegionSummary>(
    regions.map((r) => [
      r.id,
      {
        id: r.id,
        name: r.name,
        prefecture: r.prefecture,
        scarcityNote: r.scarcity_note,
        supply: { matcha: r.matcha_supply, hojicha: r.hojicha_supply },
        counts: { matcha: 0, hojicha: 0 },
      },
    ])
  );
  for (const product of products) {
    const summary = product.region_id ? summaries.get(product.region_id) : undefined;
    if (summary) summary.counts[product.category] += 1;
  }
  const total = (s: RegionSummary) => s.counts.matcha + s.counts.hojicha;
  return [...summaries.values()].sort(
    (a, b) => total(b) - total(a) || a.name.localeCompare(b.name)
  );
}

// Regions whose scarcest tea is scarcer come first; a tie goes to the scarcer other tea, then
// the incoming order (most teas first).
export function sortRegionsByScarcity(regions: RegionSummary[]): RegionSummary[] {
  const ranks = (r: RegionSummary) =>
    [supplyRank(r.supply.matcha), supplyRank(r.supply.hojicha)].sort((a, b) => a - b);
  return [...regions].sort((a, b) => {
    const [a1, a2] = ranks(a);
    const [b1, b2] = ranks(b);
    return a1 - b1 || a2 - b2;
  });
}
