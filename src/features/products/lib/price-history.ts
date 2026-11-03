import { formatSgd } from './pricing';

export interface PricePoint {
  // ISO timestamp the price was recorded.
  recordedAt: string;
  sgd: number;
  packGrams: number;
  perGram: number;
}

// numeric columns can arrive as strings from PostgREST.
export function toPricePoint(row: {
  recorded_at: string;
  price: number | string;
  pack_grams: number | string;
}): PricePoint {
  const sgd = Number(row.price);
  const packGrams = Number(row.pack_grams);
  return { recordedAt: row.recorded_at, sgd, packGrams, perGram: sgd / packGrams };
}

// UTC, so a price recorded just after midnight in Singapore reads the same on every server.
export function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatPerGram(perGram: number): string {
  return `${formatSgd(perGram)}/g`;
}

// "Up 12% since Mar 2026", comparing price per gram so a new pack size is not a rise. Null
// below two points: one price is no trend.
export function trendSummary(points: PricePoint[]): string | null {
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const since = formatMonth(first.recordedAt);
  const change = (last.perGram - first.perGram) / first.perGram;
  if (Math.abs(change) < 1e-6) return `No change since ${since}`;
  const percent = Math.round(Math.abs(change) * 100);
  const direction = change > 0 ? 'Up' : 'Down';
  return `${direction} ${percent === 0 ? 'less than 1' : percent}% since ${since}`;
}
