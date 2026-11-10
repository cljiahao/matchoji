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
  value?: Disclosure;
  onChange?: (value: Disclosure) => void;
  onBlur?: () => void;
  id?: string;
  'aria-invalid'?: boolean;
}

// Native radios with none checked: the taster has to say it, so a gifted drink can't go out as
// "none" by default.
export const DisclosureRadios = forwardRef<HTMLFieldSetElement, DisclosureRadiosProps>(
  function DisclosureRadios({ value, onChange, onBlur, id, ...aria }, ref) {
    return (
      <fieldset ref={ref} id={id} aria-label="Disclosure" className="space-y-1" {...aria}>
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
