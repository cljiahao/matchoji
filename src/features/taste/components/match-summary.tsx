import { cn } from '@/lib/utils';

import type { MatchResult } from '../types';
import { BAND_LABELS } from './match-badge';

interface MatchSummaryProps {
  match: MatchResult | null | undefined;
  hasRatings: boolean;
  className?: string;
}

const starsLabel = (stars: number) => `${stars}★`;

// Vivino's "Match for You" on a tea's page: how likely the taster is to rate it 4★ or more,
// and which of their own ratings say so.
export function MatchSummary({ match, hasRatings, className }: MatchSummaryProps) {
  if (!hasRatings) {
    return (
      <p className={cn('text-muted-foreground text-sm', className)}>
        Rate a few teas and we&apos;ll show how well each one suits you.
      </p>
    );
  }
  if (!match) {
    return (
      <p className={cn('text-muted-foreground text-sm', className)}>
        Not enough like it in your ratings to say how well it suits you yet.
      </p>
    );
  }
  const because = match.because.map((b) => `${b.name} ${starsLabel(b.stars)}`).join(' and ');
  return (
    <div className={cn('text-sm', className)}>
      <p>
        <span className="text-2xl font-extrabold tabular-nums">{match.score}%</span>{' '}
        <span className="font-semibold">match for you</span>
        <span className="text-muted-foreground"> · {BAND_LABELS[match.band]}</span>
      </p>
      {because && <p className="text-muted-foreground">Because you rated {because}.</p>}
    </div>
  );
}
