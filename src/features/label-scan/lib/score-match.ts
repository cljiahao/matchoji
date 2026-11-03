import type { ProductSummary } from '@/features/products';

import type { LabelReading } from '../schemas';

// Below this a catalogue tea is only a suggestion; the scan opens the add-a-tea form instead.
export const CONFIDENT_MATCH = 0.7;

function tokens(text: string | null | undefined): Set<string> {
  if (!text) return new Set();
  return new Set(
    text
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
}

// Dice coefficient on word sets: forgiving of word order and of "Co., Ltd." style noise.
function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return (2 * shared) / (a.size + b.size);
}

export function scoreMatch(reading: LabelReading, candidate: ProductSummary): number {
  if (reading.category && reading.category !== candidate.category) return 0;
  const wanted = new Set([...tokens(reading.maker), ...tokens(reading.name)]);
  const have = new Set([...tokens(candidate.brand), ...tokens(candidate.name)]);
  return dice(wanted, have);
}

export function pickMatch(
  reading: LabelReading,
  candidates: ProductSummary[]
): ProductSummary | null {
  let best: { product: ProductSummary; score: number } | null = null;
  for (const product of candidates) {
    const score = scoreMatch(reading, product);
    if (!best || score > best.score) best = { product, score };
  }
  return best && best.score >= CONFIDENT_MATCH ? best.product : null;
}
