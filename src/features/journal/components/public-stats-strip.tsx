import { CATEGORY_STYLES } from '@/features/products';

import type { PublicStats } from '../types';

// Counts only: the strip never shows ratings, notes or dates. The caller decides whether the
// viewer may see it, because a private profile hides it from everyone but its owner.
export function PublicStatsStrip({ stats }: { stats: PublicStats }) {
  if (stats.teas === 0) return null;
  return (
    <dl
      aria-label="Tasting stats"
      className="bg-muted grid gap-x-8 gap-y-4 rounded-3xl p-6 sm:grid-cols-3"
    >
      <div>
        <dt className="text-muted-foreground text-sm">Teas rated</dt>
        <dd className="text-2xl font-extrabold tabular-nums">{stats.teas}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground text-sm">Matcha and hojicha</dt>
        <dd className="flex items-center gap-3 text-sm font-semibold tabular-nums">
          <span className="flex items-center gap-1.5">
            <span
              className={`size-2.5 rounded-full ${CATEGORY_STYLES.matcha.fill}`}
              aria-hidden="true"
            />
            Matcha {stats.split.matcha}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`size-2.5 rounded-full ${CATEGORY_STYLES.hojicha.fill}`}
              aria-hidden="true"
            />
            Hojicha {stats.split.hojicha}
          </span>
        </dd>
      </div>
      {stats.topRegion && (
        <div>
          <dt className="text-muted-foreground text-sm">Top region</dt>
          <dd className="text-sm font-semibold">{stats.topRegion.name}</dd>
        </div>
      )}
    </dl>
  );
}
