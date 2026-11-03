import { valueScoresFor, type CatalogueTea, type ProductCategory } from '@/features/products';

import { MIN_LIST_TEAS, priorMeanOf, rankTeas, type RankedTea } from './ranking';

export const TOP_LIST_SIZE = 20;

export interface TopList {
  slug: string;
  title: string;
  blurb: string;
  teas: RankedTea[];
  // For value lists the per-tea number is the value score, not a Bayesian rating.
  kind: 'rating' | 'value';
}

const CATEGORY_NAME: Record<ProductCategory, string> = { matcha: 'matcha', hojicha: 'hojicha' };

export function regionSlug(regionName: string): string {
  const slug = regionName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .split('-')
    .filter(Boolean)
    .join('-');
  return `from-${slug || 'region'}`;
}

// Every list that has enough teas to mean something: at least MIN_LIST_TEAS teas with
// MIN_LIST_RATINGS ratings each (value lists: teas scoreable for value). Lists below that are
// left out, so the index never offers a page that would be empty or a single lucky rating.
export function buildTopLists(catalogue: CatalogueTea[]): TopList[] {
  const prior = priorMeanOf(catalogue);
  if (prior === null) return [];
  const lists: TopList[] = [];
  const add = (list: TopList) => {
    if (list.teas.length >= MIN_LIST_TEAS) {
      lists.push({ ...list, teas: list.teas.slice(0, TOP_LIST_SIZE) });
    }
  };

  const categories: ProductCategory[] = ['matcha', 'hojicha'];
  for (const category of categories) {
    const name = CATEGORY_NAME[category];
    add({
      slug: name,
      title: `Top ${name}`,
      blurb: `The best-rated ${name} on Matchoji, weighted so a single rating can’t top the list.`,
      kind: 'rating',
      teas: rankTeas(
        catalogue.filter((t) => t.category === category),
        prior
      ),
    });
  }

  const values = valueScoresFor(catalogue);
  for (const category of categories) {
    const name = CATEGORY_NAME[category];
    const teas = catalogue
      .filter((t) => t.category === category && values.has(t.id))
      .map((tea) => ({ tea, score: values.get(tea.id)?.score ?? 0 }))
      .sort((a, b) => b.score - a.score || a.tea.name.localeCompare(b.tea.name));
    add({
      slug: `best-value-${name}`,
      title: `Best value ${name}`,
      blurb: `${name[0].toUpperCase()}${name.slice(1)} rated highly for its price per gram, compared with other ${name}.`,
      kind: 'value',
      teas,
    });
  }

  const regions = new Map<string, string>();
  for (const tea of catalogue) {
    if (tea.regionId && tea.regionName && !regions.has(tea.regionId))
      regions.set(tea.regionId, tea.regionName);
  }
  const seen = new Set(lists.map((l) => l.slug));
  for (const [regionId, regionName] of [...regions].sort((a, b) => a[1].localeCompare(b[1]))) {
    const slug = regionSlug(regionName);
    if (seen.has(slug)) continue;
    const before = lists.length;
    add({
      slug,
      title: `Top from ${regionName}`,
      blurb: `The best-rated teas grown in ${regionName}, matcha and hojicha together.`,
      kind: 'rating',
      teas: rankTeas(
        catalogue.filter((t) => t.regionId === regionId),
        prior
      ),
    });
    if (lists.length > before) seen.add(slug);
  }
  return lists;
}

export function findTopList(catalogue: CatalogueTea[], slug: string): TopList | null {
  return buildTopLists(catalogue).find((l) => l.slug === slug) ?? null;
}
