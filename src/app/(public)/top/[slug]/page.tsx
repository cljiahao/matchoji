import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import { z } from 'zod';

import {
  DrinkRow,
  TOP_PAGE_SIZE,
  drinkListTitle,
  listTopDrinksPage,
  parseDrinkListSlug,
  topTeasHref,
} from '@/features/cafes';
import { findTopList } from '@/features/discovery';
import { listCatalogue } from '@/features/products';
import { createClient } from '@/integrations/supabase/server';

interface TopDrinksPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

// Anything that is not a positive whole number reads as the first page.
const PageSchema = z.coerce.number().int().min(1).max(1000).catch(1);
const pageFrom = (raw: string | string[] | undefined) =>
  PageSchema.parse(Array.isArray(raw) ? raw[0] : raw);

// One read per request, shared by the page and its metadata.
const loadDrinks = cache(async (slug: string, page: number) => {
  const key = parseDrinkListSlug(slug);
  if (!key) return undefined;
  const result = await listTopDrinksPage(await createClient(), key, page);
  return { key, ...result };
});

export async function generateMetadata({
  params,
  searchParams,
}: TopDrinksPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = pageFrom((await searchParams).page);
  const list = await loadDrinks(slug, page);
  if (!list || list.drinks.length === 0) return { title: 'List not found' };
  const title = drinkListTitle(list.key);
  return {
    title: page > 1 ? `${title}, page ${page}` : title,
    description: `${title}, ranked by trusted tasters first and then by the community.`,
  };
}

export default async function TopDrinksPage({ params, searchParams }: TopDrinksPageProps) {
  const { slug } = await params;
  const page = pageFrom((await searchParams).page);
  const list = await loadDrinks(slug, page);

  if (!list) {
    // Before drinks, /top/<slug> was a tea list; those links keep working at their new home. Only a
    // slug that is a tea list today earns a permanent redirect, so junk is never cached as one.
    const catalogue = await listCatalogue(await createClient());
    if (findTopList(catalogue, slug)) permanentRedirect(topTeasHref(slug));
    notFound();
  }
  // A list with no qualifying drink does not exist, so a stale link is not-found.
  if (list.total === 0 || list.drinks.length === 0) notFound();
  const offset = (page - 1) * TOP_PAGE_SIZE;
  const pageHref = (n: number) => (n === 1 ? `/top/${slug}` : `/top/${slug}?page=${n}`);

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <Link href="/top" className="text-brand text-sm font-semibold hover:underline">
        All top drinks
      </Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {drinkListTitle(list.key)}
      </h1>
      <p className="text-muted-foreground mt-2 max-w-xl">
        Ranked by trusted tasters first, then by the community. The two scores are never mixed.
        {list.pageCount > 1 && (
          <>
            {' '}
            Showing {offset + 1}–{offset + list.drinks.length} of {list.total}.
          </>
        )}
      </p>
      <ol className="mt-8 space-y-3">
        {list.drinks.map((drink, i) => (
          <li key={drink.id} className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="text-muted-foreground w-6 shrink-0 pt-5 text-right text-lg font-bold tabular-nums"
            >
              {offset + i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <DrinkRow drink={drink} showCafe />
            </div>
          </li>
        ))}
      </ol>
      {list.pageCount > 1 && (
        <nav
          aria-label="Pages"
          className="mt-8 flex items-center justify-between text-sm font-semibold"
        >
          {page > 1 ? (
            <Link href={pageHref(page - 1)} rel="prev" className="text-brand py-2 hover:underline">
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground font-normal">
            Page {page} of {list.pageCount}
          </span>
          {page < list.pageCount ? (
            <Link href={pageHref(page + 1)} rel="next" className="text-brand py-2 hover:underline">
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
