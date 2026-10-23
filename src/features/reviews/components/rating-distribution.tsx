import { Star } from 'lucide-react';

import { CATEGORY_STYLES, type ProductCategory } from '@/features/products';

import type { StarCount } from '../lib/summarize-reviews';

interface RatingDistributionProps {
  distribution: Record<StarCount, number>;
  category: ProductCategory;
}

const LEVELS: StarCount[] = [5, 4, 3, 2, 1];

export function RatingDistribution({ distribution, category }: RatingDistributionProps) {
  const max = Math.max(1, ...LEVELS.map((l) => distribution[l]));

  return (
    <ul className="space-y-1.5" aria-label="Rating distribution">
      {LEVELS.map((level) => (
        <li key={level} className="grid grid-cols-[2rem_1fr_2rem] items-center gap-3 text-sm">
          {/* The row reads as one phrase; the numbers and bar below are for the eye. */}
          <span className="sr-only">
            {level} {level === 1 ? 'star' : 'stars'}: {distribution[level]}{' '}
            {distribution[level] === 1 ? 'rating' : 'ratings'}
          </span>
          <span className="flex items-center gap-1 tabular-nums" aria-hidden="true">
            {level}
            <Star className="text-muted-foreground h-3 w-3" aria-hidden="true" />
          </span>
          <div className="bg-muted h-2 overflow-hidden rounded-full" aria-hidden="true">
            <div
              className={`bar-grow h-full rounded-full ${CATEGORY_STYLES[category].fill}`}
              style={{ width: `${(distribution[level] / max) * 100}%` }}
            />
          </div>
          <span className="text-muted-foreground text-right tabular-nums" aria-hidden="true">
            {distribution[level]}
          </span>
        </li>
      ))}
    </ul>
  );
}
