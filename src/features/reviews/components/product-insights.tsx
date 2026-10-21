import type { ReactNode } from 'react';

import { CATEGORY_STYLES, type ProductCategory } from '@/features/products';
import { cn } from '@/lib/utils';

import type { ReviewSummary } from '../lib/summarize-reviews';
import { FLAVOR_NOTES, noteLabel } from '../lib/tasting-vocab';
import { PrepSummary } from './prep-summary';
import { RatingDistribution } from './rating-distribution';
import { TasteProfileBars } from './taste-profile-bars';

interface ProductInsightsProps {
  summary: ReviewSummary;
  category: ProductCategory;
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        {aside && <span className="text-muted-foreground text-xs">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

// The crowd's view of a tea. Every section renders only when tastings carry its data, so a
// new product shows nothing rather than empty charts.
export function ProductInsights({ summary, category }: ProductInsightsProps) {
  const total = Object.values(summary.distribution).reduce((a, b) => a + b, 0);
  // Stored notes aren't constrained to the vocabulary for every write path; show only real ones.
  const topNotes = summary.topNotes.filter(({ note }) => FLAVOR_NOTES[category].includes(note));
  if (total === 0) return null;

  return (
    <div className="bg-card grid gap-8 rounded-lg border p-6 sm:grid-cols-2">
      <Section title="Ratings">
        <RatingDistribution distribution={summary.distribution} category={category} />
      </Section>

      {summary.profile && (
        <Section
          title="Taste profile"
          aside={`From ${summary.profile.contributors} ${summary.profile.contributors === 1 ? 'tasting' : 'tastings'}`}
        >
          <TasteProfileBars values={summary.profile.averages} category={category} />
        </Section>
      )}

      {topNotes.length > 0 && (
        <Section title="Most noticed">
          <ul className="flex flex-wrap gap-2">
            {topNotes.map(({ note, count }) => (
              <li
                key={note}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm',
                  CATEGORY_STYLES[category].tint
                )}
              >
                {noteLabel(note)}
                <span className="text-muted-foreground tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {summary.prep && (
        <Section title="How people make it">
          <PrepSummary prep={summary.prep} className="text-foreground text-base" />
        </Section>
      )}

      {summary.photos.length > 0 && (
        <div className="sm:col-span-2">
          <Section title="Photos">
            <ul className="no-scrollbar flex gap-3 overflow-x-auto">
              {summary.photos.map((url, i) => (
                <li key={url} className="shrink-0">
                  {/* Storage host is per-project, so next/image remotePatterns can't be fixed here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Review photo ${i + 1}`}
                    className="h-28 w-28 rounded-md object-cover"
                  />
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </div>
  );
}
