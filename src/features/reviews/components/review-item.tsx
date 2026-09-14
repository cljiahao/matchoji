import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { Review } from '../types';

interface ReviewItemProps {
  review: Review;
}

export function ReviewItem({ review }: ReviewItemProps) {
  return (
    <div className="border-border border-b py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex" aria-label={`${review.stars} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                'h-4 w-4',
                i < review.stars ? 'fill-foreground text-foreground' : 'text-muted-foreground'
              )}
            />
          ))}
        </div>
        <span className="text-muted-foreground text-xs">{review.reviewerEmail}</span>
      </div>
      {review.notes && <p className="mt-2 max-w-prose text-sm">{review.notes}</p>}
      {review.photoUrl && (
        // Supabase Storage host isn't known until a real project exists, so next/image's
        // remotePatterns can't be configured yet — plain img until then.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={review.photoUrl}
          alt="Review"
          className="mt-3 h-40 w-40 rounded-md object-cover"
        />
      )}
    </div>
  );
}
