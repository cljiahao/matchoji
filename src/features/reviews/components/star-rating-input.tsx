'use client';

import { Star } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface StarRatingInputProps {
  value?: number;
  onChange?: (value: number) => void;
  id?: string;
}

export const StarRatingInput = forwardRef<HTMLDivElement, StarRatingInputProps>(
  function StarRatingInput({ value = 0, onChange, id }, ref) {
    const [hovered, setHovered] = useState<number | null>(null);
    const display = hovered ?? value;

    return (
      <div
        ref={ref}
        id={id}
        role="radiogroup"
        aria-label="Rating out of 5 stars"
        className="flex gap-1"
      >
        {Array.from({ length: 5 }, (_, i) => {
          const starValue = i + 1;
          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={value === starValue}
              aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
              onClick={() => onChange?.(starValue)}
              onMouseEnter={() => setHovered(starValue)}
              onMouseLeave={() => setHovered(null)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  'h-7 w-7 transition-colors',
                  starValue <= display ? 'fill-foreground text-foreground' : 'text-muted-foreground'
                )}
              />
            </button>
          );
        })}
      </div>
    );
  }
);
