import { ScoreNumeral, Stars, type ProductSummary } from '@/features/products';

import type { ReviewSummary } from '../lib/summarize-reviews';
import type { Review } from '../types';
import { RateThisTea } from './rate-this-tea';
import { RatingDistribution } from './rating-distribution';
import { ReviewList } from './review-list';

interface CommunityReviewsProps {
  product: ProductSummary;
  avgStars: number | null;
  reviews: Review[];
  summary: ReviewSummary;
}

// Reviews on the left; the score, its spread and "add your rating" stay beside them, the
// way Vivino keeps the rating action next to what other people said.
export function CommunityReviews({ product, avgStars, reviews, summary }: CommunityReviewsProps) {
  const count = reviews.length;

  return (
    <section
      id="rate"
      aria-labelledby="reviews-heading"
      className="grid scroll-mt-24 gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16"
    >
      <div>
        <h2 id="reviews-heading" className="text-2xl font-bold tracking-tight">
          Community reviews
        </h2>
        <div className="mt-6">
          <ReviewList reviews={reviews} category={product.category} />
        </div>
      </div>

      <aside className="order-first space-y-6 lg:order-none lg:pt-14">
        {count > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-2">
              <ScoreNumeral value={avgStars} size="md" />
              <div>
                {avgStars !== null && <Stars value={avgStars} category={product.category} />}
                <p className="text-muted-foreground mt-1 text-sm">
                  {count} {count === 1 ? 'rating' : 'ratings'}
                </p>
              </div>
            </div>
            <RatingDistribution distribution={summary.distribution} category={product.category} />
          </div>
        )}
        <div className="bg-muted rounded-2xl p-5">
          <h3 className="font-semibold">Add your rating</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Tap a star, then add notes if you like.
          </p>
          <RateThisTea product={product} className="mt-3" />
        </div>
      </aside>
    </section>
  );
}
