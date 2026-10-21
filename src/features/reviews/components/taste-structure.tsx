import { CATEGORY_STYLES, type ProductCategory } from '@/features/products';
import { cn } from '@/lib/utils';

import {
  TASTE_ATTRIBUTE_LABELS,
  TASTE_POLES,
  TASTE_STRUCTURE_ORDER,
  type TasteAttribute,
} from '../lib/tasting-vocab';

interface TasteStructureProps {
  values: Partial<Record<TasteAttribute, number>>;
  category: ProductCategory;
}

const format = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// Vivino's taste sliders: each scale runs between two plain words, and a marker sits at the
// crowd's average, so "how full, how sweet" reads without knowing what a 3.4 means.
export function TasteStructure({ values, category }: TasteStructureProps) {
  const shown = TASTE_STRUCTURE_ORDER.filter((a) => values[a] !== undefined);

  return (
    <ul className="space-y-4">
      {shown.map((attribute) => {
        const value = values[attribute] as number;
        const [low, high] = TASTE_POLES[attribute];
        // 1..5 mapped onto the track, with the marker kept inside its ends.
        const position = ((value - 1) / 4) * 100;
        return (
          <li
            key={attribute}
            className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-3 text-sm sm:grid-cols-[5.5rem_1fr_5.5rem]"
          >
            <span>{low}</span>
            <div
              role="meter"
              aria-label={TASTE_ATTRIBUTE_LABELS[attribute]}
              aria-valuenow={value}
              aria-valuemin={1}
              aria-valuemax={5}
              aria-valuetext={`${format(value)} of 5, from ${low.toLowerCase()} to ${high.toLowerCase()}`}
              className="bg-muted relative h-2 rounded-full"
            >
              <span
                className={cn(
                  'marker-slide absolute top-0 h-2 w-[22%] rounded-full',
                  CATEGORY_STYLES[category].fill
                )}
                style={{ left: `${position * 0.78}%` }}
              />
            </div>
            <span className="text-right">{high}</span>
          </li>
        );
      })}
    </ul>
  );
}
