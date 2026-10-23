import { cn } from '@/lib/utils';

import type { YearValue } from '../types';

interface SparklineProps {
  points: YearValue[];
  // Names the series for screen readers, e.g. "Tea fields in Kyoto, hectares".
  label: string;
  unit: string;
  className?: string;
}

const WIDTH = 120;
const HEIGHT = 36;
const PAD = 5;

const format = (value: number) => value.toLocaleString('en-US');

// One series, so no legend: the card heading names it. Each year has a hover target wider
// than the line with a native tooltip, which works in a Server Component without script.
export function Sparkline({ points, label, unit, className }: SparklineProps) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const step = (WIDTH - PAD * 2) / (points.length - 1);
  const coords = points.map((p, i) => ({
    ...p,
    x: PAD + i * step,
    y: PAD + (1 - (p.value - min) / span) * (HEIGHT - PAD * 2),
  }));
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`${label}: ${format(first.value)} ${unit} in ${first.year}, ${format(last.value)} ${unit} in ${last.year}`}
      className={cn('h-9 w-30 overflow-visible', className)}
    >
      <polyline
        points={coords.map((c) => `${c.x},${c.y}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={coords.at(-1)?.x}
        cy={coords.at(-1)?.y}
        r={4}
        fill="currentColor"
        stroke="var(--background)"
        strokeWidth={2}
      />
      {coords.map((c) => (
        <circle key={c.year} cx={c.x} cy={c.y} r={step / 2} fill="transparent">
          <title>{`${c.year}: ${format(c.value)} ${unit}`}</title>
        </circle>
      ))}
    </svg>
  );
}
