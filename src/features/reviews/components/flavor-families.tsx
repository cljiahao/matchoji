import { Cookie, Droplets, Flame, Flower2, Leaf, Nut, Sprout, type LucideIcon } from 'lucide-react';

import type { ProductCategory } from '@/features/products';

import { FLAVOR_FAMILIES, noteLabel } from '../lib/tasting-vocab';

// Each family gets its own colour and drawn icon, like Vivino's flavour cards. These are
// flavour colours, not category colours, so they sit outside CATEGORY_STYLES.
const FAMILY_LOOK: Record<string, { color: string; icon: LucideIcon }> = {
  green: { color: '#6f8f4e', icon: Leaf },
  savoury: { color: '#3f6b5c', icon: Droplets },
  sweet: { color: '#b98a45', icon: Cookie },
  floral: { color: '#a77897', icon: Flower2 },
  bitter: { color: '#6b6a45', icon: Sprout },
  roast: { color: '#8a5a2b', icon: Flame },
  nutty: { color: '#7a6448', icon: Nut },
};

interface FlavorFamiliesProps {
  noteCounts: { note: string; count: number }[];
  category: ProductCategory;
}

export function FlavorFamilies({ noteCounts, category }: FlavorFamiliesProps) {
  const counts = new Map(noteCounts.map(({ note, count }) => [note, count]));
  const families = FLAVOR_FAMILIES[category]
    .map((family) => {
      const notes = family.notes
        .filter((n) => counts.has(n))
        .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
      const total = notes.reduce((sum, n) => sum + (counts.get(n) ?? 0), 0);
      return { ...family, notes, total };
    })
    .filter((f) => f.total > 0)
    .sort((a, b) => b.total - a.total);

  if (families.length === 0) return null;

  return (
    <ul className="no-scrollbar -mx-6 flex snap-x scroll-px-6 gap-4 overflow-x-auto px-6 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
      {families.map((family) => {
        const look = FAMILY_LOOK[family.id];
        const Icon = look.icon;
        return (
          <li
            key={family.id}
            className="border-border w-56 shrink-0 snap-start overflow-hidden rounded-2xl border sm:w-auto"
          >
            <div className="flex-center h-20" style={{ backgroundColor: look.color }}>
              <span className="flex-center h-11 w-11 rounded-full bg-white/20">
                <Icon aria-hidden="true" className="h-5 w-5 text-white" />
              </span>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="font-semibold">{family.notes.map(noteLabel).join(', ')}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {family.total} {family.total === 1 ? 'mention' : 'mentions'} of {family.name} notes
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
