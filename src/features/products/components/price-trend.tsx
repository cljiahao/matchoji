import { Sparkline } from '@/features/supply';
import { cn } from '@/lib/utils';

import { formatMonth, formatPerGram, trendSummary, type PricePoint } from '../lib/price-history';

// Price per gram over time, under the price on the tea page. Hidden until a price has changed
// at least once, since a single point is no trend.
export function PriceTrend({ history, className }: { history: PricePoint[]; className?: string }) {
  const summary = trendSummary(history);
  if (!summary) return null;
  return (
    <span className={cn('mt-1 flex items-center gap-3', className)}>
      <Sparkline
        points={history.map((p) => ({
          year: 0,
          value: p.perGram,
          label: formatMonth(p.recordedAt),
        }))}
        label="Price per gram"
        unit="S$/g"
        formatValue={formatPerGram}
        summary={`Price per gram: ${summary}`}
        className="text-foreground/70 shrink-0"
      />
      <span className="text-muted-foreground tabular-nums">{summary}</span>
    </span>
  );
}
