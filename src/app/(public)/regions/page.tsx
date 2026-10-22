import Link from 'next/link';
import { connection } from 'next/server';

import {
  CATEGORY_STYLES,
  discoverHref,
  listRegionSummaries,
  type ProductCategory,
  type RegionSummary,
} from '@/features/products';
import { shouldUseMockData } from '@/integrations/supabase/is-configured';
import { getMockRegionSummaries } from '@/integrations/supabase/mock-data';
import { createClient } from '@/integrations/supabase/server';
import { cn } from '@/lib/utils';

const CATEGORIES: ProductCategory[] = ['matcha', 'hojicha'];

function RegionCard({ region }: { region: RegionSummary }) {
  const counted = CATEGORIES.filter((category) => region.counts[category] > 0);
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
      {region.scarcityNote && (
        <span className="text-muted-foreground mt-2 text-sm">{region.scarcityNote}</span>
      )}
    </Link>
  );
}

export default async function RegionsPage() {
  // Counts are live, so the page renders per request; see the home page for why this matters
  // to builds without Supabase env vars.
  await connection();
  const regions = shouldUseMockData()
    ? getMockRegionSummaries()
    : await listRegionSummaries(await createClient());

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tea regions</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">
        Where the teas on Matchoji are grown. Pick a region to see its matcha and hojicha.
      </p>

      {regions.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
