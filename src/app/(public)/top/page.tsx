import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';

import { CITIES, DrinkRow, listTopDrinkLists, topTeasHref } from '@/features/cafes';
import { createClient } from '@/integrations/supabase/server';

export const metadata: Metadata = {
  title: 'Top hojicha and matcha drinks',
  description:
    'The best-rated hojicha and matcha drinks in Singapore and Johor Bahru, ranked by trusted tasters first.',
};

export default async function TopIndexPage() {
  // Lists are live ratings; see the home page for why this opts out of prerendering.
  await connection();
  const lists = await listTopDrinkLists(await createClient());

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Top drinks</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">
        Ranked by trusted tasters first, then by the community. A drink needs a taster review or
        three community reviews to appear. Taster and community scores are never mixed.
      </p>

      {lists.length === 0 && (
        <p className="bg-muted text-muted-foreground mt-8 rounded-3xl px-6 py-16 text-center">
          No top drinks yet. Lists appear once a drink has a taster review or three community
          reviews.
        </p>
      )}

      {CITIES.map((city) => {
        const cityLists = lists.filter((list) => list.city === city.slug);
        if (cityLists.length === 0) return null;
        return (
          <section key={city.slug} aria-labelledby={`top-${city.slug}`} className="mt-10">
            <h2 id={`top-${city.slug}`} className="text-2xl font-bold tracking-tight">
              {city.name}
            </h2>
            <ul className="mt-4 grid gap-6 md:grid-cols-2">
              {cityLists.map((list) => (
                <li key={list.slug} className="space-y-3">
                  <h3 className="text-lg font-bold tracking-tight">
                    <Link href={`/top/${list.slug}`} className="hover:underline">
                      {list.title}
                    </Link>
                  </h3>
                  <ol className="space-y-3">
                    {list.drinks.map((drink) => (
                      <li key={drink.id}>
                        <DrinkRow drink={drink} showCafe />
                      </li>
                    ))}
                  </ol>
                  {list.count > list.drinks.length && (
                    <Link
                      href={`/top/${list.slug}`}
                      className="text-brand inline-block py-2 text-sm font-semibold hover:underline"
                    >
                      See all {list.count}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section aria-labelledby="top-at-home" className="mt-14">
        <h2 id="top-at-home" className="text-2xl font-bold tracking-tight">
          At home
        </h2>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Rankings of packaged matcha and hojicha you brew yourself.
        </p>
        <Link
          href={topTeasHref()}
          className="text-brand mt-3 inline-block py-2 text-sm font-semibold hover:underline"
        >
          Top teas to brew at home
        </Link>
      </section>
    </div>
  );
}
