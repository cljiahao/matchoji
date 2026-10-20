'use client';

import { forwardRef } from 'react';

import { CATEGORY_STYLES, type ProductCategory } from '@/features/products';
import { cn } from '@/lib/utils';

import { FLAVOR_NOTES, MAX_FLAVOR_NOTES, noteLabel } from '../lib/tasting-vocab';

interface FlavorNotePickerProps {
  category: ProductCategory;
  value?: string[];
  onChange?: (value: string[]) => void;
  id?: string;
}

export const FlavorNotePicker = forwardRef<HTMLDivElement, FlavorNotePickerProps>(
  function FlavorNotePicker({ category, value = [], onChange, id }, ref) {
    const full = value.length >= MAX_FLAVOR_NOTES;

    function toggle(note: string) {
      onChange?.(value.includes(note) ? value.filter((n) => n !== note) : [...value, note]);
    }

    return (
      <div ref={ref} id={id} className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {FLAVOR_NOTES[category].map((note) => {
            const pressed = value.includes(note);
            return (
              <button
                key={note}
                type="button"
                aria-pressed={pressed}
                disabled={!pressed && full}
                onClick={() => toggle(note)}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  pressed
                    ? cn(CATEGORY_STYLES[category].badge, 'border-transparent')
                    : 'border-border hover:border-neutral-400'
                )}
              >
                {noteLabel(note)}
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs tabular-nums" aria-live="polite">
          {value.length} of {MAX_FLAVOR_NOTES}
        </p>
      </div>
    );
  }
);
