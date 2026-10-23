import type { Database } from '@/integrations/supabase/database.types';

import type { PrefectureSupply, SupplyOverview, YearValue } from '../types';

type StatRow = Pick<
  Database['public']['Tables']['tea_production_stats']['Row'],
  'prefecture' | 'year' | 'metric' | 'value' | 'source'
>;

interface RegionRow {
  id: string;
  name: string;
  prefecture: string | null;
}

const NATIONAL = 'Japan';

// PostgREST can return numeric columns as strings, so values are coerced.
const series = (rows: StatRow[], metric: StatRow['metric']): YearValue[] =>
  rows
    .filter((r) => r.metric === metric && r.source === 'maff')
    .map((r) => ({ year: r.year, value: Number(r.value) }))
    .sort((a, b) => a.year - b.year);

function tenchaShare(rows: StatRow[]): PrefectureSupply['tencha'] {
  const tencha = rows
    .filter((r) => r.metric === 'tencha_t' && r.source === 'zencharen')
    .sort((a, b) => b.year - a.year)[0];
  if (!tencha) return null;
  // The share is taken against the federation's own total for the year: its totals differ
  // from MAFF's, so dividing by MAFF's figure would mix two surveys.
  const total = rows.find(
    (r) => r.metric === 'aracha_t' && r.source === 'zencharen' && r.year === tencha.year
  );
  const tonnes = Number(tencha.value);
  return { year: tencha.year, tonnes, share: total ? tonnes / Number(total.value) : 0 };
}

const latest = (points: YearValue[]) => points.at(-1)?.value ?? 0;

// Prefectures that make the most tencha (matcha's leaf) lead, since matcha scarcity is
// what the page is about; prefectures without a tencha figure follow by raw-tea output.
export function summarizeSupply(rows: StatRow[], regions: RegionRow[]): SupplyOverview {
  const byPrefecture = new Map<string, StatRow[]>();
  for (const row of rows) {
    byPrefecture.set(row.prefecture, [...(byPrefecture.get(row.prefecture) ?? []), row]);
  }

  const summaries = [...byPrefecture].map(([prefecture, own]): PrefectureSupply => ({
    prefecture,
    regions: regions
      .filter((r) => r.prefecture === prefecture)
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    fields: series(own, 'cultivated_ha'),
    rawTea: series(own, 'aracha_t'),
    tencha: tenchaShare(own),
  }));

  return {
    national: summaries.find((s) => s.prefecture === NATIONAL) ?? null,
    prefectures: summaries
      .filter((s) => s.prefecture !== NATIONAL)
      .sort(
        (a, b) =>
          (b.tencha?.tonnes ?? -1) - (a.tencha?.tonnes ?? -1) ||
          latest(b.rawTea) - latest(a.rawTea) ||
          a.prefecture.localeCompare(b.prefecture)
      ),
  };
}

// Percentage change from the first to the last point; null with fewer than two points.
export function percentChange(points: YearValue[]): number | null {
  if (points.length < 2 || points[0].value === 0) return null;
  return ((points[points.length - 1].value - points[0].value) / points[0].value) * 100;
}

// Whole percent with a sign, using a true minus so it reads like the other figures.
export function formatChange(change: number): string {
  const rounded = Math.round(change);
  if (rounded === 0) return 'flat';
  const sign = rounded > 0 ? '+' : '−';
  return `${sign}${Math.abs(rounded)}%`;
}
