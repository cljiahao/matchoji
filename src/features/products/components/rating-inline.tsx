import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

import { CATEGORY_STYLES } from '../lib';
import type { ProductCategory } from '../types';

interface RatingInlineProps {
  avgStars: number | null;
  reviewCount: number;
  category: ProductCategory;
  className?: string;
}

const countLabel = (n: number) => `${n} ${n === 1 ? 'rating' : 'ratings'}`;

// The shelf-card rating line: one star, the score, the count.
export function RatingInline({ avgStars, reviewCount, category, className }: RatingInlineProps) {
  if (avgStars === null) {
    return <p className={cn('text-muted-foreground text-sm', className)}>Not yet rated</p>;
  }
  return (
    <p className={cn('flex items-center gap-1 text-sm', className)}>
      <span className="sr-only">
        {avgStars.toFixed(1)} out of 5, {countLabel(reviewCount)}
      </span>
      <span aria-hidden="true" className="flex items-center gap-1">
        <Star className={cn('h-3.5 w-3.5', CATEGORY_STYLES[category].star)} />
        <span className="font-bold tabular-nums">{avgStars.toFixed(1)}</span>
        <span className="text-muted-foreground tabular-nums">({countLabel(reviewCount)})</span>
      </span>
    </p>
  );
}
