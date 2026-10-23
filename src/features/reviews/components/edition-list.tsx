import type { EditionRating } from '../api/reviews-service';
import { editionLabel } from '../lib/tasting-vocab';

// "Compare harvests", like Vivino's vintages on a wine page.
export function EditionList({ editions }: { editions: EditionRating[] }) {
  if (editions.length === 0) return null;
  return (
    <section aria-labelledby="harvests" className="space-y-3">
      <h2 id="harvests" className="text-2xl font-bold tracking-tight">
        Harvests
      </h2>
      <ul className="divide-y rounded-2xl border">
        {editions.map((e) => (
          <li
            key={`${e.harvestYear}-${e.flush}`}
            className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
          >
            <span className="font-semibold capitalize">{editionLabel(e.harvestYear, e.flush)}</span>
            <span className="flex items-center gap-3">
              {e.topHarvest && (
                <span className="bg-brand/10 text-brand rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  Top rated harvest
                </span>
              )}
              <span className="tabular-nums">
                {e.avgStars.toFixed(1)}
                <span className="sr-only"> out of 5</span>
              </span>
              <span className="text-muted-foreground">
                {e.reviewCount} {e.reviewCount === 1 ? 'rating' : 'ratings'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
