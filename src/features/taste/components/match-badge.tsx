import { cn } from '@/lib/utils';

import type { MatchResult } from '../types';

export const BAND_LABELS = {
  great: 'Great match',
  average: 'Average match',
  low: 'Low match',
} as const;

// A compact "82% match" for list rows; the band is in the text, never colour alone.
export function MatchBadge({ match }: { match: MatchResult | null | undefined }) {
  if (!match) return null;
  return (
    <p
      className={cn(
        'w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums',
        match.band === 'great' ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-foreground'
      )}
    >
      {match.score}% match
      <span className="sr-only"> for you: {BAND_LABELS[match.band].toLowerCase()}</span>
    </p>
  );
}
