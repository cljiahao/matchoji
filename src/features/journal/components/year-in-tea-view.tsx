import Link from 'next/link';

import { CATEGORY_STYLES } from '@/features/products';
import { TASTE_ATTRIBUTE_LABELS, noteLabel } from '@/features/reviews';

import type { YearHighlight, YearInTea } from '../types';

function dayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Tasting({ highlight }: { highlight: YearHighlight }) {
  return (
    <>
      <p className="font-semibold">{highlight.tea}</p>
      <p className="text-muted-foreground text-sm">
        {[highlight.maker, dayLabel(highlight.date)].filter(Boolean).join(' · ')}
      </p>
    </>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// The owner's recap. The Year page shares only the counts and tea names of this, never the notes.
export function YearInTeaView({ recap }: { recap: YearInTea }) {
  const { taste } = recap;
  return (
    <div className="space-y-10">
      <section aria-labelledby="year-totals">
        <h2 id="year-totals" className="sr-only">
          Totals
        </h2>
        <dl className="bg-muted grid gap-6 rounded-3xl p-6 sm:grid-cols-3 sm:p-8">
          <Fact label="Tastings">
            <span className="text-3xl font-extrabold tabular-nums">{recap.tastings}</span>
          </Fact>
          <Fact label="Different teas">
            <span className="text-3xl font-extrabold tabular-nums">{recap.teas}</span>
          </Fact>
          <Fact label="Matcha and hojicha">
            <p className="flex flex-wrap gap-x-4 text-sm font-semibold tabular-nums">
              <span className="flex items-center gap-1.5">
                <span
                  className={`size-2.5 rounded-full ${CATEGORY_STYLES.matcha.fill}`}
                  aria-hidden="true"
                />
                Matcha {recap.split.matcha}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`size-2.5 rounded-full ${CATEGORY_STYLES.hojicha.fill}`}
                  aria-hidden="true"
                />
                Hojicha {recap.split.hojicha}
              </span>
            </p>
            <p className="text-muted-foreground text-sm tabular-nums">
              Average {recap.avgStars.toFixed(1)} stars
            </p>
          </Fact>
        </dl>
      </section>

      <section aria-labelledby="year-highlights" className="space-y-4">
        <h2 id="year-highlights" className="text-2xl font-bold tracking-tight">
          Highlights
        </h2>
        <dl className="grid gap-6 sm:grid-cols-2">
          <Fact label="Highest rated">
            <Tasting highlight={recap.topRated} />
            <p className="text-muted-foreground text-sm tabular-nums">
              {plural(recap.topRated.stars, 'star', 'stars')}
            </p>
          </Fact>
          <Fact label="Busiest month">
            <p className="font-semibold">{recap.busiestMonth.label}</p>
            <p className="text-muted-foreground text-sm tabular-nums">
              {plural(recap.busiestMonth.count, 'tasting', 'tastings')}
            </p>
          </Fact>
          <Fact label="First tasting of the year">
            <Tasting highlight={recap.first} />
          </Fact>
          <Fact label="Latest tasting">
            <Tasting highlight={recap.latest} />
          </Fact>
          {recap.newestMaker && (
            <Fact label="Newest maker you tried">
              <p className="font-semibold">{recap.newestMaker.maker}</p>
              <p className="text-muted-foreground text-sm">
                {recap.newestMaker.tea} · {dayLabel(recap.newestMaker.date)}
              </p>
            </Fact>
          )}
        </dl>
      </section>

      <section aria-labelledby="year-taste" className="space-y-3">
        <h2 id="year-taste" className="text-2xl font-bold tracking-tight">
          How your taste moved
        </h2>
        {taste.hasBaseline ? (
          <>
            {taste.shifts.length > 0 ? (
              <ul className="space-y-2">
                {taste.shifts.map((s) => (
                  <li key={s.attribute}>
                    {TASTE_ATTRIBUTE_LABELS[s.attribute]} in the teas you love moved toward{' '}
                    <strong>{s.toward.toLowerCase()}</strong> ({s.from.toFixed(1)} to{' '}
                    {s.to.toFixed(1)} out of 5).
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                Your taste held steady: the teas you love look much like last year&apos;s.
              </p>
            )}
            {taste.newNotes.length > 0 && (
              <p>New favourite notes: {taste.newNotes.map(noteLabel).join(', ')}.</p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">
            This is your first year of tasting, so there is nothing to compare with yet.
            {taste.favouriteNotes.length > 0 &&
              ` Your favourite notes so far: ${taste.favouriteNotes.map(noteLabel).join(', ')}.`}
          </p>
        )}
        <p>
          <Link
            href="/journal"
            className="text-brand inline-flex min-h-11 items-center font-semibold hover:underline"
          >
            Back to your journal
          </Link>
        </p>
      </section>
    </div>
  );
}
