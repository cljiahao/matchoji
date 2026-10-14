'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import type { Review } from '../types';
import { ReviewItem } from './review-item';

// The page fetches every review up front — fine at Phase 1 volume — so paging is purely
// presentational. Move to range() queries if a product ever collects hundreds.
const PAGE_SIZE = 10;

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (reviews.length === 0) {
    return <p className="text-muted-foreground text-sm">No reviews yet — be the first.</p>;
  }

  const remaining = reviews.length - visibleCount;

  return (
    <div>
      {reviews.slice(0, visibleCount).map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
      {remaining > 0 && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
        >
          Load more ({remaining} left)
        </Button>
      )}
    </div>
  );
}
