import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

import { CATEGORY_STYLES } from '../lib';
import type { ProductCategory } from '../types';

interface StarsProps {
  value: number;
  category: ProductCategory;
  size?: 'sm' | 'md';
}

export function Stars({ value, category, size = 'md' }: StarsProps) {
  const filled = Math.round(value);
  return (
    <div className="flex" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            i < filled ? CATEGORY_STYLES[category].star : 'text-muted-foreground'
          )}
        />
      ))}
    </div>
  );
}

interface StarRatingDisplayProps {
  avgStars: number | null;
  reviewCount: number;
  category: ProductCategory;
  className?: string;
}

export function StarRatingDisplay({
  avgStars,
  reviewCount,
  category,
  className,
}: StarRatingDisplayProps) {
  if (avgStars === null) {
    return <span className={cn('text-muted-foreground text-sm', className)}>Not yet rated</span>;
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Stars value={avgStars} category={category} />
      <span className="text-muted-foreground text-sm tabular-nums">
        {avgStars.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}
