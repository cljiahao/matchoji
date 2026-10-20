import Link from 'next/link';

import { CATEGORY_STYLES, CategoryBadge, Stars } from '@/features/products';
import { FLAVOR_NOTES, PrepSummary, noteLabel } from '@/features/reviews';
import { cn } from '@/lib/utils';

import { groupByMonth } from '../lib/journal-stats';
import type { JournalEntry } from '../types';

// tasted_on is a calendar date; formatting it as UTC keeps the day from shifting.
function dayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export function JournalTimeline({ entries }: { entries: JournalEntry[] }) {
  return (
    <div className="space-y-10">
      {groupByMonth(entries).map(({ month, entries: monthEntries }) => (
        <section key={month} aria-labelledby={`month-${month}`}>
          <h2 id={`month-${month}`} className="text-lg font-semibold">
            {month}
          </h2>
          <ul className="bg-card mt-3 divide-y rounded-lg border">
            {monthEntries.map((entry) => {
              const notes = entry.flavorNotes.filter((n) =>
                FLAVOR_NOTES[entry.product.category].includes(n)
              );
              return (
                <li key={entry.id} className="grid grid-cols-[3.5rem_1fr] gap-4 p-4">
                  <time
                    dateTime={entry.tastedOn}
                    className="text-muted-foreground pt-0.5 text-sm tabular-nums"
                  >
                    {dayLabel(entry.tastedOn)}
                  </time>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/products/${entry.product.id}`}
                        className="font-semibold hover:underline hover:underline-offset-2"
                      >
                        {entry.product.name}
                      </Link>
                      <CategoryBadge category={entry.product.category} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Stars value={entry.stars} category={entry.product.category} size="sm" />
                      <span className="sr-only">{entry.stars} out of 5</span>
                    </div>
                    {entry.notes && <p className="max-w-prose text-sm">{entry.notes}</p>}
                    {notes.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {notes.map((note) => (
                          <li
                            key={note}
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-xs',
                              CATEGORY_STYLES[entry.product.category].tint
                            )}
                          >
                            {noteLabel(note)}
                          </li>
                        ))}
                      </ul>
                    )}
                    <PrepSummary prep={entry.prep} className="text-xs" />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
