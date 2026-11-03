import type { CatalogueTea } from '@/features/products';

import { MIN_LIST_TEAS, isQualified, priorMeanOf, rankTeas } from './ranking';

// The tea itself needs this many ratings before it earns a claim.
export const MIN_HIGHLIGHT_RATINGS = 5;
export const MAX_HIGHLIGHTS = 3;
// "Top 10%" then "Top 25%": the tightest tier the tea still falls in.
const PERCENT_TIERS = [10, 25] as const;

const gradeKey = (tea: CatalogueTea) => tea.grade?.trim().toLowerCase() || null;

function categoryLine(tea: CatalogueTea, catalogue: CatalogueTea[], prior: number): string | null {
  const sameCategory = catalogue.filter((t) => t.category === tea.category);
  if (sameCategory.filter(isQualified).length < MIN_LIST_TEAS) return null;
  const ranked = rankTeas(sameCategory, prior);
  const own = ranked.find((r) => r.tea.id === tea.id);
  if (!own) return null;
  // Teas tied on score share a place, so a tie never earns "highest".
  const tiedOrAbove = ranked.filter((r) => r.score >= own.score).length;
  if (tiedOrAbove === 1) return `Highest rated ${tea.category} on Matchoji`;
  const percent = PERCENT_TIERS.find((p) => tiedOrAbove / ranked.length <= p / 100);
  return percent ? `Top ${percent}% of ${tea.category} on Matchoji` : null;
}

function regionLine(tea: CatalogueTea, catalogue: CatalogueTea[], prior: number): string | null {
  if (!tea.regionId || !tea.regionName) return null;
  const region = catalogue.filter((t) => t.regionId === tea.regionId);
  if (region.filter(isQualified).length < MIN_LIST_TEAS) return null;
  const [best, next] = rankTeas(region, prior);
  const leads = best?.tea.id === tea.id && best.score > (next?.score ?? -Infinity);
  return leads ? `Highest rated from ${tea.regionName}` : null;
}

function mostRatedLine(tea: CatalogueTea, catalogue: CatalogueTea[]): string | null {
  const grade = gradeKey(tea);
  if (!grade) return null;
  const peers = catalogue.filter(
    (t) => t.category === tea.category && gradeKey(t) === grade && isQualified(t)
  );
  if (peers.length < MIN_LIST_TEAS) return null;
  const leads = peers.every((t) => t.id === tea.id || t.reviewCount < tea.reviewCount);
  return leads ? `Most rated ${grade} ${tea.category}` : null;
}

// Short, true statements about where a tea stands, each computed from the catalogue and
// shown only when the tea has MIN_HIGHLIGHT_RATINGS ratings and the group it is compared with
// holds MIN_LIST_TEAS teas of MIN_LIST_RATINGS ratings or more. Too little data gives [].
export function buildHighlights(tea: CatalogueTea, catalogue: CatalogueTea[]): string[] {
  if (tea.avgStars === null || tea.reviewCount < MIN_HIGHLIGHT_RATINGS) return [];
  const prior = priorMeanOf(catalogue);
  if (prior === null) return [];
  return [
    categoryLine(tea, catalogue, prior),
    regionLine(tea, catalogue, prior),
    mostRatedLine(tea, catalogue),
  ]
    .filter((line): line is string => line !== null)
    .slice(0, MAX_HIGHLIGHTS);
}
