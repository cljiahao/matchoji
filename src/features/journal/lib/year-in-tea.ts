import { TASTE_ATTRIBUTES, TASTE_POLES } from '@/features/reviews';
import { buildTasteProfile } from '@/features/taste';

import type {
  JournalEntry,
  JournalItem,
  TasteShift,
  YearCardData,
  YearHighlight,
  YearInTea,
} from '../types';
import { teaEntries } from './journal-stats';

// Below this a "year in tea" is just the journal again.
export const YEAR_MIN_TASTINGS = 3;
// An average has to move this far on the 1-5 slider to count as a shift.
const SHIFT_MIN = 0.25;
const MAX_SHIFTS = 2;

const inYear = (e: JournalEntry, year: number) => e.tastedOn.startsWith(`${year}-`);

// Years with enough tastings to recap, newest first.
export function qualifyingYears(items: JournalItem[]): number[] {
  const counts = new Map<number, number>();
  for (const e of teaEntries(items)) {
    const year = Number(e.tastedOn.slice(0, 4));
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }
  return [...counts]
    .filter(([, n]) => n >= YEAR_MIN_TASTINGS)
    .map(([year]) => year)
    .sort((a, b) => b - a);
}

const highlight = (e: JournalEntry): YearHighlight => ({
  tea: e.product.name,
  maker: e.product.brand,
  date: e.tastedOn,
  stars: e.stars,
});

// tasted_on is a calendar date with no zone, so months are named in UTC.
function monthName(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  });
}

function tasteMovement(entries: JournalEntry[], year: number): YearInTea['taste'] {
  const before = buildTasteProfile(entries.filter((e) => e.tastedOn < `${year}-01-01`));
  const after = buildTasteProfile(entries.filter((e) => e.tastedOn <= `${year}-12-31`));
  const hasBaseline = before.ratedTeas > 0;

  const shifts: TasteShift[] = [];
  for (const attribute of TASTE_ATTRIBUTES) {
    const from = before.liked[attribute];
    const to = after.liked[attribute];
    if (from === undefined || to === undefined || Math.abs(to - from) < SHIFT_MIN) continue;
    shifts.push({ attribute, from, to, toward: TASTE_POLES[attribute][to > from ? 1 : 0] });
  }
  shifts.sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from));

  return {
    hasBaseline,
    shifts: hasBaseline ? shifts.slice(0, MAX_SHIFTS) : [],
    newNotes: hasBaseline
      ? after.favouriteNotes.filter((n) => !before.favouriteNotes.includes(n))
      : [],
    favouriteNotes: after.favouriteNotes,
  };
}

// The recap for one calendar year, or null when the year has too few tastings. `entries` is the
// whole journal, newest first: earlier years are the baseline for what is new.
export function buildYearInTea(items: JournalItem[], year: number): YearInTea | null {
  const entries = teaEntries(items);
  const mine = entries.filter((e) => inYear(e, year));
  if (mine.length < YEAR_MIN_TASTINGS) return null;

  const chronological = [...mine].sort((a, b) => a.tastedOn.localeCompare(b.tastedOn));
  const newestFirst = [...chronological].reverse();

  const split = { matcha: 0, hojicha: 0 };
  let starTotal = 0;
  const monthCounts = new Map<string, number>();
  for (const e of chronological) {
    split[e.product.category] += 1;
    starTotal += e.stars;
    const month = e.tastedOn.slice(0, 7);
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
  }

  // Ties go to the later tasting or month: the recap leans toward what is freshest.
  const topRated = newestFirst.reduce((best, e) => (e.stars > best.stars ? e : best));
  const [busiest] = [...monthCounts].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]));

  const firstSeen = new Map<string, JournalEntry>();
  for (const e of [...entries].sort((a, b) => a.tastedOn.localeCompare(b.tastedOn))) {
    if (e.product.brand && !firstSeen.has(e.product.brand)) firstSeen.set(e.product.brand, e);
  }
  const newMakers = [...firstSeen].filter(([, e]) => inYear(e, year));
  const newest = newMakers.sort((a, b) => b[1].tastedOn.localeCompare(a[1].tastedOn))[0];

  return {
    year,
    tastings: mine.length,
    teas: new Set(mine.map((e) => e.product.id)).size,
    split,
    avgStars: starTotal / mine.length,
    first: highlight(chronological[0]),
    latest: highlight(chronological[chronological.length - 1]),
    topRated: highlight(topRated),
    busiestMonth: { label: monthName(`${busiest[0]}-01`), count: busiest[1] },
    newestMaker: newest
      ? { maker: newest[0], tea: newest[1].product.name, date: newest[1].tastedOn }
      : null,
    taste: tasteMovement(entries, year),
  };
}

export function toYearCard(recap: YearInTea, taster: string): YearCardData {
  return {
    taster,
    year: recap.year,
    tastings: recap.tastings,
    teas: recap.teas,
    split: recap.split,
    topRated: { tea: recap.topRated.tea, stars: recap.topRated.stars },
    busiestMonth: recap.busiestMonth.label,
  };
}
