import type { ProductCategory } from '../types';

export interface RegionSummary {
  id: string;
  name: string;
  prefecture: string | null;
  scarcityNote: string | null;
  counts: Record<ProductCategory, number>;
}

interface RegionInput {
  id: string;
  name: string;
  prefecture: string | null;
  scarcity_note: string | null;
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
