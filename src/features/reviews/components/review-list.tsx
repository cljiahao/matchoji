'use client';

import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import type { ProductCategory } from '@/features/products';

import type { Review } from '../types';
import { ReviewItem } from './review-item';

// The page fetches every review up front — fine at Phase 1 volume — so paging is purely
// presentational. Move to range() queries if a product ever collects hundreds.
const PAGE_SIZE = 10;

interface ReviewListProps {
  reviews: Review[];
  category: ProductCategory;
  // Rendered under each review, keyed by review id (elements, so they can cross from server).
  footers?: Record<string, ReactNode>;
}

export function ReviewList({ reviews, category, footers }: ReviewListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (reviews.length === 0) {
    return <p className="text-muted-foreground">No reviews yet. Be the first to rate it.</p>;
  }

  const remaining = reviews.length - visibleCount;

  return (
    <div className="space-y-4">
      {reviews.slice(0, visibleCount).map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          category={category}
          footer={footers?.[review.id]}
        />
      ))}
      {remaining > 0 && (
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
        >
          Show more reviews ({remaining})
        </Button>
      )}
    </div>
  );
}
