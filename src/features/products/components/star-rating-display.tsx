import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

import { CATEGORY_STYLES } from '../lib';
import type { ProductCategory } from '../types';

interface StarsProps {
  value: number;
  category: ProductCategory;
  size?: 'sm' | 'md';
}

// Stars fill fractionally, so 4.5 reads as four and a half and always agrees with the
// numeral beside it.
export function Stars({ value, category, size = 'md' }: StarsProps) {
  const box = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <div className="flex" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <span key={i} className={cn('relative', box)} data-fill={fill}>
            <Star className={cn('absolute inset-0 text-neutral-300', box)} />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className={cn(box, CATEGORY_STYLES[category].star)} />
              </span>
            )}
          </span>
        );
      })}
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
