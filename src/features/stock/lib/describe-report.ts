import type { StockReport } from '../types';

// Stock moves fast during the shortage; a report older than this says little about today.
export const STALE_AFTER_DAYS = 14;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? '' : 's'} ago`;

export function reportedAgo(reportedAt: string, now: Date): string {
  const elapsed = Math.max(0, now.getTime() - new Date(reportedAt).getTime());
  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return plural(Math.floor(elapsed / MINUTE), 'minute');
  if (elapsed < DAY) return plural(Math.floor(elapsed / HOUR), 'hour');
  return plural(Math.floor(elapsed / DAY), 'day');
}

export function isStale(report: StockReport, now: Date): boolean {
  return now.getTime() - new Date(report.reportedAt).getTime() > STALE_AFTER_DAYS * DAY;
}
