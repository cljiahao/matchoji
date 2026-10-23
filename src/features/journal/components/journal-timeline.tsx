import Link from 'next/link';

import { CatalogueStatusNote, CATEGORY_STYLES, Stars, TeaTin } from '@/features/products';
import { FLAVOR_NOTES, noteLabel, PrepSummary } from '@/features/reviews';
import { cn } from '@/lib/utils';

import { groupByMonth } from '../lib/journal-stats';
import type { JournalEntry } from '../types';

// ids can't hold spaces ("October 2026"), so headings are keyed by the ISO month.
const monthId = (isoDate: string) => `month-${isoDate.slice(0, 7)}`;

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
        <section key={month} aria-labelledby={monthId(monthEntries[0].tastedOn)}>
          <h2 id={monthId(monthEntries[0].tastedOn)} className="text-xl font-bold tracking-tight">
            {month}
          </h2>
          <ul className="mt-4 space-y-3">
            {monthEntries.map((entry) => {
              const notes = entry.flavorNotes.filter((n) =>
                FLAVOR_NOTES[entry.product.category].includes(n)
              );
              return (
                <li
                  key={entry.id}
                  className="border-border grid grid-cols-[4rem_1fr] gap-4 rounded-2xl border p-4"
                >
                  <div className="bg-tile flex-center aspect-square rounded-xl">
                    <TeaTin
                      category={entry.product.category}
                      seed={entry.product.id}
                      mark={entry.product.brand ?? entry.product.name}
                      className="w-7"
                    />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <Link
                          href={`/products/${entry.product.id}`}
                          className="font-bold hover:underline"
                        >
                          {entry.product.name}
                        </Link>
                        <CatalogueStatusNote status={entry.product.status} />
                      </span>
                      <time
                        dateTime={entry.tastedOn}
                        className="text-muted-foreground text-sm tabular-nums"
                      >
                        {dayLabel(entry.tastedOn)}
                      </time>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stars value={entry.stars} category={entry.product.category} size="sm" />
                      <span className="sr-only">You rated it {entry.stars} out of 5</span>
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
