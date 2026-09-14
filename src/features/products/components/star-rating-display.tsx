import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

interface StarRatingDisplayProps {
  avgStars: number | null;
  reviewCount: number;
  className?: string;
}

export function StarRatingDisplay({ avgStars, reviewCount, className }: StarRatingDisplayProps) {
  if (avgStars === null) {
    return <span className={cn('text-muted-foreground text-sm', className)}>Not yet rated</span>;
  }

  const filled = Math.round(avgStars);

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              i < filled ? 'fill-foreground text-foreground' : 'text-muted-foreground'
            )}
          />
        ))}
      </div>
      <span className="text-muted-foreground text-sm">
        {avgStars.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}
