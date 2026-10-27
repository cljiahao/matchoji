import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { WantToTryButton } from '@/features/journal';
import {
  CATEGORY_STYLES,
  ExploreFilters,
  ExploreSort,
  FilterDisclosure,
  PAGE_SIZE,
  ProductRow,
  SearchPill,
  discoverProgress,
  listGradeOptions,
  listProducts,
  listRegions,
  parseDiscoverParams,
  type DiscoverFilters,
} from '@/features/products';
import { LogTastingDialog } from '@/features/reviews';
import { MatchBadge, loadMatches } from '@/features/taste';
import { createClient } from '@/integrations/supabase/server';

const MATCH_POOL = 500;

export const metadata: Metadata = { title: 'Explore teas' };

function activeFilterCount({ category, regionId, grade, minRating }: DiscoverFilters): number {
  return [category, regionId, grade, minRating].filter(Boolean).length;
}

function noMatchMessage(filters: DiscoverFilters): string {
  if (filters.q) return `No teas match “${filters.q}”.`;
  if (filters.grade || filters.minRating) return 'No teas match these filters.';
  return 'No teas from this region yet.';
}

interface ExplorePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const filters = parseDiscoverParams(await searchParams);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // "Best match" ranks by a score computed per taster, so it reads the matching teas (up to
  // MATCH_POOL, ample for this catalogue) and trims in memory; every other sort pages in SQL.
  const byMatch = filters.sort === 'match' && user !== null;
  const shown = filters.shown ?? PAGE_SIZE;

  // Regions only feed the filter; losing them hides the rail section, not the results.
  const [listing, grades, regions] = await Promise.all([
    byMatch
      ? listProducts(supabase, { ...filters, sort: 'top' }, { limit: MATCH_POOL })
      : listProducts(supabase, filters),
    listGradeOptions(supabase, filters),
    listRegions(supabase).catch(() => []),
  ]);
  const taste = user
    ? await loadMatches(
        supabase,
        user.id,
        listing.products.map((p) => p.id)
      )
    : null;
  const scoreOf = (id: string) => taste?.matches.get(id)?.score ?? -1;
  const products = byMatch
    ? [...listing.products].sort((a, b) => scoreOf(b.id) - scoreOf(a.id)).slice(0, shown)
    : listing.products;
  const total = byMatch ? listing.products.length : listing.total;
  const { countLabel, moreHref } = discoverProgress(filters, products.length, total);

  // Any narrowing that leaves nothing is "no match", not an empty catalogue.
  const narrowed = Boolean(filters.q || filters.regionId || filters.grade || filters.minRating);
  const teaName = filters.category ? CATEGORY_STYLES[filters.category].label : 'Teas';
  let heading = filters.category ? `Explore ${teaName}` : 'Explore teas';
  if (filters.q) heading = `Results for “${filters.q}”`;

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
        <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:self-start">
          <FilterDisclosure activeCount={activeFilterCount(filters)}>
            <ExploreFilters filters={filters} regions={regions} grades={grades} />
          </FilterDisclosure>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchPill filters={filters} className="sm:w-80" />
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <p className="text-muted-foreground text-sm" aria-live="polite">
                {countLabel}
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
                      badge={<MatchBadge match={taste?.matches.get(product.id)} />}
                      action={<WantToTryButton productId={product.id} compact />}
                    />
                  </li>
                ))}
              </ul>
            )}
            {moreHref && (
              <div className="mt-6 flex justify-center">
                {/* A plain link, so the list grows without client JS and the URL keeps the count. */}
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <Link href={moreHref} scroll={false}>
                    Show more
                  </Link>
                </Button>
              </div>
            )}
            {products.length === 0 && narrowed && (
              <div className="bg-muted flex-center flex-col gap-3 rounded-3xl py-16 text-center">
                <p className="text-muted-foreground">{noMatchMessage(filters)}</p>
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
