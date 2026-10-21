import type { JournalEntry, JournalStats } from '../types';

const TOP_NOTES = 3;

export function computeJournalStats(entries: JournalEntry[]): JournalStats {
  const split = { matcha: 0, hojicha: 0 };
  const noteCounts = new Map<string, number>();
  let starTotal = 0;

  for (const e of entries) {
    split[e.product.category] += 1;
    starTotal += e.stars;
    for (const note of e.flavorNotes) noteCounts.set(note, (noteCounts.get(note) ?? 0) + 1);
  }

  return {
    count: entries.length,
    avgStars: entries.length ? starTotal / entries.length : null,
    split,
    // Stable sort keeps first-seen order for ties, and entries arrive newest first.
    topNotes: [...noteCounts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_NOTES)
      .map(([note]) => note),
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

export function groupByMonth(
  entries: JournalEntry[]
): { month: string; entries: JournalEntry[] }[] {
  const sorted = [...entries].sort((a, b) => b.tastedOn.localeCompare(a.tastedOn));
  const groups: { month: string; entries: JournalEntry[] }[] = [];
  for (const entry of sorted) {
    const month = monthLabel(entry.tastedOn);
    const last = groups.at(-1);
    if (last?.month === month) last.entries.push(entry);
    else groups.push({ month, entries: [entry] });
  }
  return groups;
}
