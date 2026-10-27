import { cn } from '@/lib/utils';

import { PRICE_BAND_LABELS, formatSgd, type TeaPrice } from '../lib/pricing';

// "S$0.80/g · Mid-range" for cards and rows; nothing for an unpriced tea.
export function PriceInline({ price, className }: { price: TeaPrice | null; className?: string }) {
  if (!price) return null;
  return (
    <p className={cn('text-muted-foreground text-sm tabular-nums', className)}>
      {formatSgd(price.perGram)}/g
      {price.band && (
        <>
          {' · '}
          <span className="text-foreground font-semibold">{PRICE_BAND_LABELS[price.band]}</span>
        </>
      )}
    </p>
  );
}
