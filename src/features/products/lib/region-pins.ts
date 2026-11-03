import type { MapPin } from '@/components/widgets';

import { CATEGORY_STYLES } from './category-styles';
import { discoverHref } from './discover-params';
import type { RegionSummary } from './summarize-regions';
import { SUPPLY_LABELS, supplyRank } from './supply';

// Town or area centres, public geography. Keyed by the region's name as the seed writes it;
// a region added later without an entry simply has no pin, and its card still lists it.
export const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Uji, Kyoto': { lat: 34.8845, lng: 135.7998 },
  'Nishio, Aichi': { lat: 34.8617, lng: 137.0617 },
  'Yame, Fukuoka': { lat: 33.2129, lng: 130.5586 },
  Shizuoka: { lat: 34.9769, lng: 138.3831 },
  Kagoshima: { lat: 31.5966, lng: 130.5571 },
  'Sayama, Saitama': { lat: 35.8528, lng: 139.4122 },
  'Ise, Mie': { lat: 34.4913, lng: 136.7092 },
};

const CATEGORIES = ['matcha', 'hojicha'] as const;

function dominantTone(counts: RegionSummary['counts']): 'matcha' | 'hojicha' | 'neutral' {
  if (counts.matcha === counts.hojicha) return 'neutral';
  return counts.matcha > counts.hojicha ? 'matcha' : 'hojicha';
}

export function regionPins(regions: RegionSummary[]): MapPin[] {
  return regions.flatMap((region) => {
    const at = REGION_COORDINATES[region.name];
    if (!at) return [];
    const total = region.counts.matcha + region.counts.hojicha;
    const scarcest = Math.min(supplyRank(region.supply.matcha), supplyRank(region.supply.hojicha));
    const facts = [
      total === 0
        ? 'No teas yet'
        : CATEGORIES.filter((c) => region.counts[c] > 0)
            .map((c) => `${region.counts[c]} ${CATEGORY_STYLES[c].label.toLowerCase()}`)
            .join(', '),
      ...CATEGORIES.flatMap((c) => {
        const level = region.supply[c];
        return level
          ? [`${CATEGORY_STYLES[c].label} supply ${SUPPLY_LABELS[level].toLowerCase()}`]
          : [];
      }),
    ];
    const tone = dominantTone(region.counts);
    return [
      {
        id: region.id,
        ...at,
        name: region.name,
        text: String(total),
        flagged: scarcest === 0,
        tone,
        description: facts.join('. '),
        href: discoverHref({ sort: 'top' }, { regionId: region.id }),
      },
    ];
  });
}
