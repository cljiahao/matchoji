import type { PrepMethod } from '@/features/reviews';

import type { JournalEntry, JournalItem, JournalStats, PublicStats, Ranked } from '../types';

// Drink tastings have no tea, so everything tea-shaped (counts, makers, regions, the taste
// profile) is computed from these alone.
export const teaEntries = (items: JournalItem[]): JournalEntry[] =>
  items.filter((e): e is JournalEntry => 'product' in e);

const TOP_NOTES = 3;
// A "top maker" from one or two tastings is noise, so these wait for three.
export const MIN_TASTINGS_FOR_TOPS = 3;

const todayUtc = () => new Date().toISOString().slice(0, 10);

// Most frequent value; ties go to the first seen, and entries arrive newest first.
function topCount(values: string[]): Ranked | null {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const [top] = [...counts].sort((a, b) => b[1] - a[1]);
  // A winner that appears once is not a favourite.
  return top && top[1] >= 2 ? { name: top[0], count: top[1] } : null;
}

const dayNumber = (isoDate: string) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};

function longestRun(days: string[]): number {
  const sorted = days.map(dayNumber).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  sorted.forEach((n, i) => {
    run = i > 0 && n - sorted[i - 1] === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

export function computeJournalStats(
  items: JournalItem[],
  today: string = todayUtc()
): JournalStats {
  const entries = teaEntries(items);
  const split = { matcha: 0, hojicha: 0 };
  const noteCounts = new Map<string, number>();
  let starTotal = 0;

  for (const e of entries) {
    split[e.product.category] += 1;
    starTotal += e.stars;
    for (const note of e.flavorNotes) noteCounts.set(note, (noteCounts.get(note) ?? 0) + 1);
  }

  const enough = entries.length >= MIN_TASTINGS_FOR_TOPS;
  const month = today.slice(0, 7);
  const monthDays = [...new Set(entries.map((e) => e.tastedOn).filter((d) => d.startsWith(month)))];
  const prep = enough
    ? topCount(entries.flatMap((e) => (e.prep.method ? [e.prep.method] : [])))
    : null;

  return {
    count: entries.length,
    teas: new Set(entries.map((e) => e.product.id)).size,
    avgStars: entries.length ? starTotal / entries.length : null,
    split,
    // Stable sort keeps first-seen order for ties, and entries arrive newest first.
    topNotes: [...noteCounts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_NOTES)
      .map(([note]) => note),
    topMaker: enough
      ? topCount(entries.flatMap((e) => (e.product.brand ? [e.product.brand] : [])))
      : null,
    topRegion: enough
      ? topCount(entries.flatMap((e) => (e.regionName ? [e.regionName] : [])))
      : null,
    topPrep: prep ? (prep.name as PrepMethod) : null,
    tastingDays: monthDays.length,
    streak: longestRun(monthDays),
  };
}

// Counts per distinct tea (its latest tasting), so re-logging a favourite doesn't inflate them.
export function computePublicStats(items: JournalItem[]): PublicStats {
  const entries = teaEntries(items);
  const seen = new Set<string>();
  const teas = entries.filter((e) => !seen.has(e.product.id) && seen.add(e.product.id));
  const split = { matcha: 0, hojicha: 0 };
  for (const e of teas) split[e.product.category] += 1;
  return {
    teas: teas.length,
    split,
    topRegion:
      teas.length >= MIN_TASTINGS_FOR_TOPS
        ? topCount(teas.flatMap((e) => (e.regionName ? [e.regionName] : [])))
        : null,
  };
}

// tasted_on is a calendar date with no time zone, so it is formatted as UTC to avoid the
// local offset moving the 1st of a month into the previous one.
function monthLabel(isoDate: string): string {
  const [year, month] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function groupByMonth(entries: JournalItem[]): { month: string; entries: JournalItem[] }[] {
  const sorted = [...entries].sort((a, b) => b.tastedOn.localeCompare(a.tastedOn));
  const groups: { month: string; entries: JournalItem[] }[] = [];
  for (const entry of sorted) {
    const month = monthLabel(entry.tastedOn);
    const last = groups.at(-1);
    if (last?.month === month) last.entries.push(entry);
    else groups.push({ month, entries: [entry] });
  }
  return groups;
}
