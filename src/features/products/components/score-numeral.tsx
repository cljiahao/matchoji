import { cn } from '@/lib/utils';

interface ScoreNumeralProps {
  value: number | null;
  size: 'sm' | 'md' | 'lg';
  className?: string;
}

// The average as a numeral is the first thing a taster reads, so it outranks the stars.
export function ScoreNumeral({ value, size, className }: ScoreNumeralProps) {
  return (
    <span
      className={cn(
        'leading-none font-extrabold tracking-tight tabular-nums',
        { sm: 'text-xl', md: 'text-3xl', lg: 'text-6xl' }[size],
        value === null && 'text-muted-foreground',
        className
      )}
    >
      {value === null ? (
        // Unrated: the dash is decoration; the label beside it says "Not yet rated".
        <span aria-hidden="true">–</span>
      ) : (
        <>
          {value.toFixed(1)}
          <span className="sr-only"> out of 5</span>
        </>
      )}
    </span>
  );
}
