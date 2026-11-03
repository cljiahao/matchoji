import { CATEGORY_STYLES, ScoreNumeral } from '@/features/products';
import { PREP_METHOD_LABELS, noteLabel } from '@/features/reviews';

import type { JournalStats } from '../types';

interface JournalStatsStripProps {
  stats: JournalStats;
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// The maker, region and preparation stats appear only once the journal can back them up, so a
// young journal shows fewer, truer numbers instead of a favourite drawn from one tasting.
export function JournalStatsStrip({ stats }: JournalStatsStripProps) {
  const total = stats.split.matcha + stats.split.hojicha;
  const matchaShare = total ? (stats.split.matcha / total) * 100 : 0;

  return (
    <section aria-labelledby="your-stats">
      <h2 id="your-stats" className="sr-only">
        Your stats
      </h2>
      <dl className="bg-muted grid gap-6 rounded-3xl p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
        <Stat label="Teas rated">
          <span className="text-3xl font-extrabold tabular-nums">{stats.teas}</span>
          <p className="text-muted-foreground mt-2 text-sm tabular-nums">
            {plural(stats.count, 'tasting', 'tastings')}
          </p>
        </Stat>
        <Stat label="Average rating">
          <ScoreNumeral value={stats.avgStars} size="sm" className="text-3xl" />
        </Stat>
        <Stat label="Category split">
          {/* The counts below carry the numbers; the bar is their picture. */}
          <div className="bg-background flex h-2 overflow-hidden rounded-full" aria-hidden="true">
            <div className={CATEGORY_STYLES.matcha.fill} style={{ width: `${matchaShare}%` }} />
            <div
              className={CATEGORY_STYLES.hojicha.fill}
              style={{ width: `${100 - matchaShare}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-2 text-sm tabular-nums">
            {`Matcha ${stats.split.matcha} · Hojicha ${stats.split.hojicha}`}
          </p>
        </Stat>
        <Stat label="Your notes">
          {stats.topNotes.length ? (
            <p className="text-sm">{stats.topNotes.map(noteLabel).join(', ')}</p>
          ) : (
            <p className="text-muted-foreground text-sm">None picked yet</p>
          )}
        </Stat>
        {stats.topMaker && (
          <Stat label="Top maker">
            <p className="text-sm font-semibold">{stats.topMaker.name}</p>
            <p className="text-muted-foreground text-sm tabular-nums">
              {plural(stats.topMaker.count, 'tasting', 'tastings')}
            </p>
          </Stat>
        )}
        {stats.topRegion && (
          <Stat label="Top region">
            <p className="text-sm font-semibold">{stats.topRegion.name}</p>
            <p className="text-muted-foreground text-sm tabular-nums">
              {plural(stats.topRegion.count, 'tasting', 'tastings')}
            </p>
          </Stat>
        )}
        {stats.topPrep && (
          <Stat label="Usual preparation">
            <p className="text-sm font-semibold">{PREP_METHOD_LABELS[stats.topPrep]}</p>
          </Stat>
        )}
        {stats.tastingDays > 0 && (
          <Stat label="This month">
            <p className="text-sm font-semibold tabular-nums">
              {plural(stats.tastingDays, 'tasting day', 'tasting days')}
            </p>
            {stats.streak >= 2 && (
              <p className="text-muted-foreground text-sm tabular-nums">{stats.streak} in a row</p>
            )}
          </Stat>
        )}
      </dl>
    </section>
  );
}
