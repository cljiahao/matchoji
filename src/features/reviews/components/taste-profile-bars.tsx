import { CATEGORY_STYLES, type ProductCategory } from '@/features/products';
import { cn } from '@/lib/utils';

import {
  TASTE_ATTRIBUTES,
  TASTE_ATTRIBUTE_LABELS,
  type TasteAttribute,
} from '../lib/tasting-vocab';

interface TasteProfileBarsProps {
  values: Partial<Record<TasteAttribute, number>>;
  category: ProductCategory;
  compact?: boolean;
}

const format = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// One component reads both a single tasting and a product's average, so the two compare
// at a glance.
export function TasteProfileBars({ values, category, compact = false }: TasteProfileBarsProps) {
  const shown = TASTE_ATTRIBUTES.filter((a) => values[a] !== undefined);

  return (
    <ul className={cn('w-full', compact ? 'space-y-1' : 'space-y-2.5')}>
      {shown.map((attribute) => {
        const value = values[attribute] as number;
        const label = TASTE_ATTRIBUTE_LABELS[attribute];
        return (
          <li
            key={attribute}
            className={cn(
              'grid items-center gap-3',
              compact ? 'grid-cols-[5rem_1fr] text-xs' : 'grid-cols-[6rem_1fr_2.5rem] text-sm'
            )}
          >
            <span className={cn(compact && 'text-muted-foreground')}>{label}</span>
            <div
              role="meter"
              aria-label={label}
              aria-valuenow={value}
              aria-valuemin={1}
              aria-valuemax={5}
              className={cn('bg-muted overflow-hidden rounded-full', compact ? 'h-1.5' : 'h-2')}
            >
              <div
                className={cn('bar-grow h-full rounded-full', CATEGORY_STYLES[category].fill)}
                style={{ width: `${(value / 5) * 100}%` }}
              />
            </div>
            {!compact && (
              <span className="text-muted-foreground text-right tabular-nums">{format(value)}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
