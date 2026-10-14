'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

import { CATEGORY_STYLES, type ProductCategory } from '@/features/products';
import { cn } from '@/lib/utils';

import { truncateNotes } from '../lib';
import type { Review } from '../types';

// Roughly four lines at the max-w-prose width.
const NOTES_PREVIEW_CHARS = 280;

interface ReviewItemProps {
  review: Review;
  category: ProductCategory;
}

export function ReviewItem({ review, category }: ReviewItemProps) {
  const [expanded, setExpanded] = useState(false);
  const preview = review.notes ? truncateNotes(review.notes, NOTES_PREVIEW_CHARS) : null;

  return (
    <div className="border-border border-b py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex" aria-label={`${review.stars} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                'h-4 w-4',
                i < review.stars ? CATEGORY_STYLES[category].star : 'text-muted-foreground'
              )}
            />
          ))}
        </div>
        <span className="text-muted-foreground text-xs">{review.reviewerName}</span>
      </div>
      {review.notes && preview && (
        <p className="mt-2 max-w-prose text-sm whitespace-pre-line">
          {expanded ? review.notes : preview.text}
          {preview.truncated && (
            <>
              {' '}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="text-foreground font-medium underline underline-offset-2"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            </>
          )}
        </p>
      )}
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
