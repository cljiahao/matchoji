'use client';

import { handleRadioKeyDown, radioTabIndex } from '@/features/reviews';
import { cn } from '@/lib/utils';

const STEPS = [1, 2, 3, 4, 5] as const;

interface ScaleInputProps {
  label: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
}

// A 1-5 scale where every score is optional: choosing the current step again clears it.
export function ScaleInput({ label, value, onChange }: ScaleInputProps) {
  const labelId = `scale-${label.toLowerCase().replaceAll(' ', '-')}`;
  return (
    <div className="grid grid-cols-[6rem_1fr_2rem] items-center gap-3">
      <span id={labelId} className="text-sm">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="flex gap-1">
        {STEPS.map((step, index) => (
          <button
            key={step}
            type="button"
            role="radio"
            aria-checked={value === step}
            aria-label={`${label} ${step} of 5`}
            tabIndex={radioTabIndex(index, value === undefined ? -1 : value - 1)}
            onKeyDown={(e) =>
              handleRadioKeyDown(e, index, STEPS.length, (i) => onChange?.(STEPS[i]))
            }
            onClick={() => onChange?.(value === step ? undefined : step)}
            className="group flex h-10 flex-1 items-center"
          >
            <span
              className={cn(
                'h-2 w-full rounded-full transition-colors',
                value !== undefined && step <= value
                  ? 'bg-primary'
                  : 'bg-muted group-hover:bg-input'
              )}
            />
          </button>
        ))}
      </div>
      <span className="text-muted-foreground text-right text-sm tabular-nums">{value ?? '–'}</span>
    </div>
  );
}
