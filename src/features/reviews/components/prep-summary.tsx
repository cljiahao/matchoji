import { cn } from '@/lib/utils';

import { PREP_METHOD_LABELS } from '../lib/tasting-vocab';
import type { ReviewPrep } from '../types';

interface PrepSummaryProps {
  prep: ReviewPrep;
  className?: string;
}

const trim = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function formatPrep(prep: ReviewPrep): string | null {
  if (!prep.method) return null;
  return [
    PREP_METHOD_LABELS[prep.method],
    prep.doseG !== null && `${trim(prep.doseG)}g`,
    prep.waterMl !== null && `${trim(prep.waterMl)}ml`,
    prep.waterTempC !== null && `${trim(prep.waterTempC)}°C`,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function PrepSummary({ prep, className }: PrepSummaryProps) {
  const text = formatPrep(prep);
  if (!text) return null;
  return <p className={cn('text-muted-foreground text-sm tabular-nums', className)}>{text}</p>;
}
