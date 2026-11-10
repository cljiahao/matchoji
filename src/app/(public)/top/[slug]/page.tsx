import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';

import {
  DrinkRow,
  drinkListTitle,
  listTopDrinks,
  parseDrinkListSlug,
  topTeasHref,
} from '@/features/cafes';
import { createClient } from '@/integrations/supabase/server';

interface TopDrinksPageProps {
  params: Promise<{ slug: string }>;
}

// Tea-list slugs are lowercase words and hyphens; anything else is not worth redirecting.
const TEA_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// One read per request, shared by the page and its metadata.
const loadDrinks = cache(async (slug: string) => {
  const key = parseDrinkListSlug(slug);
  if (!key) return undefined;
  const drinks = await listTopDrinks(await createClient(), key);
  return { key, drinks };
});

export async function generateMetadata({ params }: TopDrinksPageProps): Promise<Metadata> {
  const { slug } = await params;
  const list = await loadDrinks(slug);
  if (!list || list.drinks.length === 0) return { title: 'List not found' };
  const title = drinkListTitle(list.key);
  return {
    title,
    description: `${title}, ranked by trusted tasters first and then by the community.`,
  };
}

export default async function TopDrinksPage({ params }: TopDrinksPageProps) {
  const { slug } = await params;
  const list = await loadDrinks(slug);

  if (!list) {
    // Before drinks, /top/<slug> was a tea list; those links keep working at their new home.
    if (TEA_SLUG.test(slug)) permanentRedirect(topTeasHref(slug));
    notFound();
  }
  // A list with no qualifying drink does not exist, so a stale link is not-found.
  if (list.drinks.length === 0) notFound();

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
      </p>
      <ol className="mt-8 space-y-3">
        {list.drinks.map((drink, i) => (
          <li key={drink.id} className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="text-muted-foreground w-6 shrink-0 pt-5 text-right text-lg font-bold tabular-nums"
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <DrinkRow drink={drink} showCafe />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
