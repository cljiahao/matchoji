import { cn } from '@/lib/utils';

interface ScoreNumeralProps {
  value: number | null;
  size: 'sm' | 'lg';
  className?: string;
}

// The average as a numeral is the first thing a taster reads, so it outranks the stars.
export function ScoreNumeral({ value, size, className }: ScoreNumeralProps) {
  return (
    <span
      className={cn(
        'leading-none font-black tracking-tight tabular-nums',
        size === 'lg' ? 'text-5xl' : 'text-xl',
        value === null && 'text-muted-foreground',
        className
      )}
    >
      {value === null ? '–' : value.toFixed(1)}
    </span>
  );
}
