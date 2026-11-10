import { ScoreNumeral } from '@/features/products';
import { cn } from '@/lib/utils';

import type { ScorePair as Scores } from '../types';

interface ScorePairProps {
  scores: Scores;
  // The list form drops the big numerals so rows stay scannable at phone width.
  compact?: boolean;
  className?: string;
}

const reviewsLabel = (count: number) => `${count} ${count === 1 ? 'review' : 'reviews'}`;

function Block({
  label,
  avg,
  count,
  compact,
}: {
  label: string;
  avg: number;
  count: number;
  compact: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <ScoreNumeral value={avg} size={compact ? 'sm' : 'md'} />
      <div className="text-sm leading-tight">
        <p className="font-semibold">{label}</p>
        <p className="text-muted-foreground">{reviewsLabel(count)}</p>
      </div>
    </div>
  );
}

// Taster and community scores sit side by side and are never averaged together: a visitor can
// tell whose opinion each number is. A disclosed (invited, gifted or paid) taster review still counts,
// and the line under the score says how many were.
export function ScorePair({ scores, compact = false, className }: ScorePairProps) {
  const hasTaster = scores.tasterAvg !== null && scores.tasterCount > 0;
  const hasCommunity = scores.communityAvg !== null && scores.communityCount > 0;

  if (!hasTaster && !hasCommunity) {
    return <p className={cn('text-muted-foreground text-sm', className)}>Not yet rated</p>;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn('flex flex-wrap gap-x-8 gap-y-3', compact && 'gap-x-5 gap-y-2')}>
        {hasTaster && scores.tasterAvg !== null && (
          <Block
            label={compact ? 'Taster' : 'Taster score'}
            avg={scores.tasterAvg}
            count={scores.tasterCount}
            compact={compact}
          />
        )}
        {hasCommunity && scores.communityAvg !== null && (
          <Block
            label={compact ? 'Community' : 'Community score'}
            avg={scores.communityAvg}
            count={scores.communityCount}
            compact={compact}
          />
        )}
      </div>
      {hasTaster && scores.tasterDisclosedCount > 0 && (
        <p className="text-muted-foreground text-xs">
          {scores.tasterDisclosedCount} of {scores.tasterCount} taster{' '}
          {scores.tasterCount === 1 ? 'review was' : 'reviews were'} invited, gifted or paid
        </p>
      )}
    </div>
  );
}
