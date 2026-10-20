import Link from 'next/link';

import {
  DiscoverToolbar,
  EmptyState,
  ProductGrid,
  listProducts,
  listRegions,
  parseDiscoverParams,
  sortProducts,
} from '@/features/products';
import { LogTastingDialog } from '@/features/reviews';
import { shouldUseMockData } from '@/integrations/supabase/is-configured';
import { getMockProducts } from '@/integrations/supabase/mock-data';
import { createClient } from '@/integrations/supabase/server';

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const filters = parseDiscoverParams(await searchParams);

  const [products, regions] = shouldUseMockData()
    ? [sortProducts(getMockProducts(filters.category), filters.sort), []]
    : await (async () => {
        const supabase = await createClient();
        // Regions only feed the filter; losing them hides the picker instead of the feed.
        return Promise.all([
          listProducts(supabase, filters),
          listRegions(supabase).catch(() => []),
        ]);
      })();

  // Search or region narrowing to nothing is "no match", not an empty catalogue.
  const narrowed = Boolean(filters.q || filters.regionId);

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Discover</h1>
      <p className="text-muted-foreground mt-2">
        Rate and discover hojicha and matcha, one cup at a time.
      </p>

      <div className="mt-8">
        <DiscoverToolbar filters={filters} regions={regions} />
      </div>

      <div className="mt-8">
        {products.length > 0 && <ProductGrid products={products} />}
        {products.length === 0 && narrowed && (
          <div className="flex-center bg-card flex-col gap-3 rounded-lg border py-16 text-center">
            <p className="text-muted-foreground">
              {filters.q ? `No teas match “${filters.q}”.` : 'No teas from this region yet.'}
            </p>
            <Link href="/" className="text-sm font-medium underline underline-offset-4">
              Clear filters
            </Link>
          </div>
        )}
        {products.length === 0 && !narrowed && (
          <EmptyState category={filters.category}>
            <LogTastingDialog restoresDraft={false} />
          </EmptyState>
        )}
      </div>
    </div>
  );
}
