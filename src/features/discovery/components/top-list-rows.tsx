import Link from 'next/link';

import { ProductRow, ValueBadge, valueScoresFor, type CatalogueTea } from '@/features/products';

import type { TopList } from '../lib/top-lists';

// A ranked list: a rank number beside each tea's row; value lists also badge "Great value".
export function TopListRows({ list, catalogue }: { list: TopList; catalogue: CatalogueTea[] }) {
  const values = valueScoresFor(catalogue);
  return (
    <ol className="space-y-3">
      {list.teas.map(({ tea }, i) => (
        <li key={tea.id} className="flex items-center gap-3 sm:gap-5">
          <span
            aria-hidden="true"
            className="text-muted-foreground w-7 shrink-0 text-center text-xl font-bold tabular-nums sm:w-9 sm:text-2xl"
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <ProductRow product={tea} badge={<ValueBadge value={values.get(tea.id)} />} />
          </div>
        </li>
      ))}
    </ol>
  );
}

// An index card for one list: its title, blurb and size, linking to the list page.
export function TopListCard({ list }: { list: TopList }) {
  const leader = list.teas[0]?.tea;
  return (
    <Link
      href={`/top/teas/${list.slug}`}
      className="bg-muted hover:bg-muted/70 flex h-full min-h-11 flex-col rounded-2xl px-5 py-4 transition-colors"
    >
      <h2 className="text-lg font-bold tracking-tight">{list.title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{list.blurb}</p>
      {leader && (
        <p className="mt-3 text-sm">
          <span className="text-muted-foreground">Leading: </span>
          <span className="font-semibold">{leader.name}</span>
        </p>
      )}
    </Link>
  );
}
