import Link from 'next/link';

import { cafeHref } from '../lib/hrefs';
import type { CafeListing } from '../types';
import { ScorePair } from './score-pair';

export function CafeCard({ cafe }: { cafe: CafeListing }) {
  return (
    <Link
      href={cafeHref(cafe.slug)}
      className="border-border hover:bg-muted/60 focus-visible:ring-ring block rounded-2xl border p-5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <h3 className="text-lg font-bold tracking-tight">{cafe.name}</h3>
      <p className="text-muted-foreground mt-0.5 text-sm">
        {[cafe.area, `${cafe.drinkCount} ${cafe.drinkCount === 1 ? 'drink' : 'drinks'}`]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <ScorePair scores={cafe.scores} compact className="mt-3" />
    </Link>
  );
}
