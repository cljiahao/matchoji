import { cn } from '@/lib/utils';

import type { ValueScore } from '../lib/value-score';

// "Great value" for a tea rated well for its price within its category; the claim is in the
// text and nothing renders for teas that don't qualify or lack the data to be judged.
export function ValueBadge({
  value,
  className,
}: {
  value: ValueScore | null | undefined;
  className?: string;
}) {
  if (!value?.great) return null;
  return (
    <p
      className={cn(
        'bg-brand/10 text-brand w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold',
        className
      )}
    >
      Great value
      <span className="sr-only"> for its price among teas of its kind</span>
    </p>
  );
}
