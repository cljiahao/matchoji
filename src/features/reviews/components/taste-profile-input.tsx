'use client';

import { CATEGORY_STYLES, type ProductCategory } from '@/features/products';
import { cn } from '@/lib/utils';

import { handleRadioKeyDown, radioTabIndex } from '../lib/roving-radio';
import { TASTE_ATTRIBUTE_LABELS, type TasteAttribute } from '../lib/tasting-vocab';

const STEPS = [1, 2, 3, 4, 5] as const;

interface TasteProfileInputProps {
  attribute: TasteAttribute;
  value?: number;
  onChange?: (value: number | undefined) => void;
  category?: ProductCategory;
}

// Five segments fill left to right like the read-only profile bars, so logging and reading
// a profile look the same. Clicking the chosen step clears it: every attribute is optional.
export function TasteProfileInput({
  attribute,
  value,
  onChange,
  category,
}: TasteProfileInputProps) {
  const label = TASTE_ATTRIBUTE_LABELS[attribute];
  const fill = category ? CATEGORY_STYLES[category].fill : 'bg-primary';

  return (
    <div className="grid grid-cols-[6rem_1fr_2rem] items-center gap-3">
      <span id={`taste-${attribute}`} className="text-sm">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={`taste-${attribute}`} className="flex gap-1">
        {STEPS.map((step, index) => (
          <button
            key={step}
            type="button"
            role="radio"
            aria-checked={value === step}
            tabIndex={radioTabIndex(index, value === undefined ? -1 : value - 1)}
            onKeyDown={(e) =>
              handleRadioKeyDown(e, index, STEPS.length, (i) => onChange?.(STEPS[i]))
            }
            aria-label={`${label} ${step} of 5`}
            onClick={() => onChange?.(value === step ? undefined : step)}
            className="group flex h-10 flex-1 items-center"
          >
            <span
              className={cn(
                'h-2 w-full rounded-full transition-colors',
                value !== undefined && step <= value ? fill : 'bg-muted group-hover:bg-neutral-300'
              )}
            />
          </button>
        ))}
      </div>
      <span className="text-muted-foreground text-right text-sm tabular-nums">{value ?? '–'}</span>
    </div>
  );
}
