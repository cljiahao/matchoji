import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';

import {
  CATEGORY_STYLES,
  SUPPLY_LABELS,
  discoverHref,
  listRegionSummaries,
  sortRegionsByScarcity,
  type ProductCategory,
  type RegionSummary,
} from '@/features/products';
import { createClient } from '@/integrations/supabase/server';
import { PAGE_ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Tea regions' };

const CATEGORIES: ProductCategory[] = ['matcha', 'hojicha'];

const SORTS = [
  { value: undefined, label: 'Most teas', href: PAGE_ROUTES.REGIONS },
  { value: 'scarce', label: 'Scarcest first', href: `${PAGE_ROUTES.REGIONS}?sort=scarce` },
] as const;

function RegionCard({ region }: { region: RegionSummary }) {
  const counted = CATEGORIES.filter((category) => region.counts[category] > 0);
  const supplied = CATEGORIES.flatMap((category) => {
    const level = region.supply[category];
    return level
      ? [`${CATEGORY_STYLES[category].label} ${SUPPLY_LABELS[level].toLowerCase()}`]
      : [];
  });
  return (
    <Link
      href={discoverHref({ sort: 'top' }, { regionId: region.id })}
      className="bg-muted hover:bg-muted/70 flex h-full flex-col rounded-2xl px-5 py-4 transition-colors"
    >
      {region.prefecture && (
        <span className="text-muted-foreground text-sm">{region.prefecture}</span>
      )}
      <span className="text-lg font-bold tracking-tight">{region.name}</span>
      <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {counted.length === 0 && <span className="text-muted-foreground">No teas yet</span>}
        {counted.map((category) => (
          <span key={category} className="flex items-center gap-1.5 font-semibold">
            <span
              aria-hidden="true"
              className={cn('h-2.5 w-2.5 rounded-full', CATEGORY_STYLES[category].fill)}
            />
            {region.counts[category]} {CATEGORY_STYLES[category].label.toLowerCase()}
          </span>
        ))}
      </span>
      {supplied.length > 0 && <span className="mt-2 text-sm">{supplied.join(' · ')}</span>}
      {region.scarcityNote && (
        <span className="text-muted-foreground mt-2 text-sm">{region.scarcityNote}</span>
      )}
    </Link>
  );
}

interface RegionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RegionsPage({ searchParams }: RegionsPageProps) {
  // Counts are live, so the page renders per request; see the home page for why this matters
  // to builds without Supabase env vars.
  await connection();
  const scarcest = (await searchParams).sort === 'scarce';
  const summaries = await listRegionSummaries(await createClient());
  const regions = scarcest ? sortRegionsByScarcity(summaries) : summaries;

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tea regions</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">
        Where the teas on Matchoji are grown. Pick a region to see its matcha and hojicha. Supply
        levels come from public reporting on the matcha shortage.{' '}
        <Link href={PAGE_ROUTES.SUPPLY} className="text-foreground underline underline-offset-2">
          See the harvest numbers
        </Link>
      </p>

      <nav aria-label="Sort regions" className="mt-6 flex gap-2">
        {SORTS.map((sort) => {
          const active = scarcest === (sort.value === 'scarce');
          return (
            <Link
              key={sort.label}
              href={sort.href}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-foreground text-background font-semibold'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {sort.label}
            </Link>
          );
        })}
      </nav>

      {regions.length > 0 ? (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((region) => (
            <li key={region.id}>
              <RegionCard region={region} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="bg-muted text-muted-foreground mt-8 rounded-3xl py-16 text-center">
          No regions listed yet.
        </p>
      )}
    </div>
  );
}
