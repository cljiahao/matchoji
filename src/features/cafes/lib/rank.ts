import type { DrinkListing } from '../types';

// A drink needs one taster review or three community reviews before it is ranked, so a single
// anonymous five-star cannot top a list.
export const COMMUNITY_THRESHOLD = 3;

export const qualifiesForTop = ({ scores }: DrinkListing): boolean =>
  scores.tasterCount >= 1 || scores.communityCount >= COMMUNITY_THRESHOLD;

// Taster-reviewed drinks come before community-only ones, then higher score, then more reviews.
// Recency never enters, so a fresh paid post cannot move a drink up.
export function compareDrinks(a: DrinkListing, b: DrinkListing): number {
  const aTaster = a.scores.tasterCount > 0;
  const bTaster = b.scores.tasterCount > 0;
  if (aTaster !== bTaster) return aTaster ? -1 : 1;
  const [aAvg, aCount] = aTaster
    ? [a.scores.tasterAvg, a.scores.tasterCount]
    : [a.scores.communityAvg, a.scores.communityCount];
  const [bAvg, bCount] = bTaster
    ? [b.scores.tasterAvg, b.scores.tasterCount]
    : [b.scores.communityAvg, b.scores.communityCount];
  return (bAvg ?? 0) - (aAvg ?? 0) || bCount - aCount || a.name.localeCompare(b.name);
}
