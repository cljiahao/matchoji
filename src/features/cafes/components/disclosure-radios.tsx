'use client';

import { forwardRef } from 'react';

import type { Disclosure } from '@/integrations/supabase/database.types';
import { cn } from '@/lib/utils';

import { DISCLOSURES } from '../schemas/drink-review.schema';

const LABELS: Record<Disclosure, string> = {
  none: 'No — I paid for it myself',
  invited: 'Invited by the café',
  gifted: 'Gifted drink',
  paid: 'Paid partnership',
};

interface DisclosureRadiosProps {
  // The visible question, rendered as the group's legend so it is the accessible name.
  legend: string;
  value?: Disclosure;
  onChange?: (value: Disclosure) => void;
  onBlur?: () => void;
  invalid?: boolean;
}

// Native radios with none checked: the taster has to say it, so a gifted drink can't go out as
// "none" by default.
export const DisclosureRadios = forwardRef<HTMLFieldSetElement, DisclosureRadiosProps>(
  function DisclosureRadios({ legend, value, onChange, onBlur, invalid }, ref) {
    return (
      <fieldset ref={ref} aria-invalid={invalid} className="space-y-1">
        <legend className="mb-2 text-sm font-medium">{legend}</legend>
        {DISCLOSURES.map((option) => (
          <label
            key={option}
            className={cn(
              'flex min-h-10 cursor-pointer items-center gap-3 rounded-md border px-3 text-sm',
              value === option && 'border-primary bg-muted'
            )}
          >
            <input
              type="radio"
              name="disclosure"
              value={option}
              checked={value === option}
              onChange={() => onChange?.(option)}
              onBlur={onBlur}
              className="accent-primary h-4 w-4"
            />
            {LABELS[option]}
          </label>
        ))}
      </fieldset>
    );
  }
);
