import { CATEGORY_STYLES, ScoreNumeral } from '@/features/products';
import { noteLabel } from '@/features/reviews';

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

export function JournalStatsStrip({ stats }: JournalStatsStripProps) {
  const total = stats.split.matcha + stats.split.hojicha;
  const matchaShare = total ? (stats.split.matcha / total) * 100 : 0;

  return (
    <dl className="bg-muted grid gap-6 rounded-3xl p-6 sm:grid-cols-4 sm:p-8">
      <Stat label="Tastings">
        <span className="text-3xl font-extrabold tabular-nums">{stats.count}</span>
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
    </dl>
  );
}
