import { cn } from '@/lib/utils';

import type { ProductCategory } from '../types';

// Flat-drawn tin in the category's colours. It stands in for a product photo, so a shelf of
// unphotographed teas still reads as a shelf of tea rather than a row of empty boxes.
// Each product gets its own tone, height and label initial, so neighbours on a shelf differ.
const TONES = {
  matcha: [
    { body: '#5c7a4f', shade: '#4d6942', lid: '#3d5634', ink: '#4d6942' },
    { body: '#6f8c58', shade: '#5e7a4b', lid: '#2f4a2a', ink: '#2f4a2a' },
    { body: '#4a6741', shade: '#3e5837', lid: '#5c7a4f', ink: '#3e5837' },
  ],
  hojicha: [
    { body: '#8f6224', shade: '#7a531d', lid: '#5f4015', ink: '#7a531d' },
    { body: '#a3712f', shade: '#8c6127', lid: '#4a3110', ink: '#5f4015' },
    { body: '#74501d', shade: '#634418', lid: '#a3712f', ink: '#634418' },
  ],
} as const;

const LABELS = ['#f5f1e6', '#f2efe7', '#faf6ec'] as const;

// A stable, cheap string hash: the same product always draws the same tin.
function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

interface TeaTinProps {
  category: ProductCategory;
  // Usually the product id; without one every tin of a category is the same.
  seed?: string;
  // Printed as an initial on the label (the brand, or the name when there is none).
  mark?: string | null;
  className?: string;
}

export function TeaTin({ category, seed = '', mark, className }: TeaTinProps) {
  const h = hash(seed);
  const c = TONES[category][h % 3];
  const label = LABELS[(h >>> 2) % 3];
  // Short tins drop the body top by 14 units; the lid and label move with it.
  const top = (h >>> 4) % 2 ? 14 : 0;
  const initial = mark?.trim().charAt(0).toUpperCase();

  let labelArt =
    category === 'matcha' ? (
      <g fill="none" stroke={c.ink} strokeWidth="2.2" strokeLinecap="round">
        <path d="M48 104c0-14 9-23 24-23 0 14-9 23-24 23Z" fill={c.ink} fillOpacity="0.18" />
        <path d="M48 104 66 87" />
      </g>
    ) : (
      <g fill={c.ink}>
        <path
          d="M47 103c1-12 9-20 22-21-1 12-9 20-22 21Z"
          fillOpacity="0.85"
          transform="rotate(-8 58 92)"
        />
        <circle cx="72" cy="99" r="2.2" />
        <circle cx="66" cy="104" r="1.6" />
        <circle cx="76" cy="92" r="1.4" />
      </g>
    );
  if (initial) {
    labelArt = (
      <text
        x="60"
        y={99 + top / 2}
        textAnchor="middle"
        fontSize="26"
        fontWeight="800"
        fill={c.ink}
        fontFamily="var(--font-figtree), sans-serif"
      >
        {initial}
      </text>
    );
  }

  return (
    <svg
      viewBox="0 0 120 160"
      aria-hidden="true"
      className={cn('h-auto w-full', className)}
      data-tin={category}
    >
      <ellipse cx="60" cy="150" rx="40" ry="5" fill="#000" opacity="0.08" />
      <rect x="22" y={34 + top} width="76" height={114 - top} rx="8" fill={c.body} />
      <rect x="78" y={34 + top} width="20" height={114 - top} rx="8" fill={c.shade} />
      <rect x="30" y={38 + top} width="5" height={106 - top} rx="2.5" fill="#fff" opacity="0.14" />
      <rect x="18" y={16 + top} width="84" height="24" rx="6" fill={c.lid} />
      <rect x="18" y={35 + top} width="84" height="5" fill="#000" opacity="0.12" />
      <rect x="22" y={66 + top / 2} width="76" height="50" fill={label} />
      <rect x="22" y={70 + top / 2} width="76" height="1.5" fill={c.ink} opacity="0.5" />
      <rect x="22" y={110.5 + top / 2} width="76" height="1.5" fill={c.ink} opacity="0.5" />
      {labelArt}
    </svg>
  );
}
