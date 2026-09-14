import type { Review } from '../types';
import { ReviewItem } from './review-item';

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className="text-muted-foreground text-sm">No reviews yet — be the first.</p>;
  }

  return (
    <div>
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
    </div>
  );
}
