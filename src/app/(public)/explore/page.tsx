import Link from 'next/link';

import { WantToTryButton } from '@/features/journal';
import {
  CATEGORY_STYLES,
  ExploreFilters,
  ExploreSort,
  ProductRow,
  SearchPill,
  listProducts,
  listRegions,
  parseDiscoverParams,
  sortProducts,
} from '@/features/products';
import { LogTastingDialog } from '@/features/reviews';
import { shouldUseMockData } from '@/integrations/supabase/is-configured';
import { getMockProducts } from '@/integrations/supabase/mock-data';
import { createClient } from '@/integrations/supabase/server';

interface ExplorePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const filters = parseDiscoverParams(await searchParams);

  const [products, regions] = shouldUseMockData()
    ? [sortProducts(getMockProducts(filters.category), filters.sort), []]
    : await (async () => {
        const supabase = await createClient();
        // Regions only feed the filter; losing them hides the rail section, not the results.
        return Promise.all([
          listProducts(supabase, filters),
          listRegions(supabase).catch(() => []),
        ]);
      })();

  // Search or region narrowing to nothing is "no match", not an empty catalogue.
  const narrowed = Boolean(filters.q || filters.regionId);
  const teaName = filters.category ? CATEGORY_STYLES[filters.category].label : 'Teas';
  let heading = filters.category ? `Explore ${teaName}` : 'Explore teas';
  if (filters.q) heading = `Results for “${filters.q}”`;

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
        <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:self-start">
          <ExploreFilters filters={filters} regions={regions} />
        </aside>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchPill filters={filters} className="sm:w-80" />
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <p className="text-muted-foreground text-sm" aria-live="polite">
                Showing {products.length} {products.length === 1 ? 'tea' : 'teas'}
              </p>
              <ExploreSort filters={filters} />
            </div>
          </div>

          <div className="mt-6">
            {products.length > 0 && (
              <ul className="space-y-3">
                {products.map((product) => (
                  <li key={product.id}>
                    <ProductRow
                      product={product}
                      action={<WantToTryButton productId={product.id} compact />}
                    />
                  </li>
                ))}
              </ul>
            )}
            {products.length === 0 && narrowed && (
              <div className="bg-muted flex-center flex-col gap-3 rounded-3xl py-16 text-center">
                <p className="text-muted-foreground">
                  {filters.q ? `No teas match “${filters.q}”.` : 'No teas from this region yet.'}
                </p>
                <Link href="/explore" className="text-brand text-sm font-semibold hover:underline">
                  Clear filters
                </Link>
              </div>
            )}
            {products.length === 0 && !narrowed && (
              <div className="bg-muted flex-center flex-col gap-4 rounded-3xl py-16 text-center">
                <p className="text-muted-foreground max-w-sm">
                  {filters.category
                    ? `No ${teaName.toLowerCase()} rated yet. Be the first to rate one.`
                    : 'No teas rated yet. Be the first to rate a matcha or hojicha.'}
                </p>
                <LogTastingDialog />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
