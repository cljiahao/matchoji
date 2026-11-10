import { Plus } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { connection } from 'next/server';

import { Button } from '@/components/ui/button';
import { LogDialog } from '@/components/widgets/log-dialog';
import {
  CITY_COOKIE,
  CitySwitch,
  DrinkRow,
  cityBySlug,
  drinkHref,
  listCafes,
  listLatestTasterDrinkReviews,
  listTopDrinks,
  resolveCity,
  topDrinksHref,
  topTeasHref,
  type CafeListing,
} from '@/features/cafes';
import { ReviewItem } from '@/features/reviews';
import { TastingFeed, loadFeed, type Tasting } from '@/features/social';
import { createClient } from '@/integrations/supabase/server';
import { PAGE_ROUTES } from '@/lib/constants/routes';

const RAIL_SIZE = 3;
const TOP_SIZE = 5;

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (value: string | string[] | undefined) =>
  typeof value === 'string' ? value : undefined;

// Signed-in readers who follow people see their latest tastings, as on Vivino.
async function loadFollowingFeed(): Promise<Tasting[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? loadFeed(supabase) : [];
}

// Cafés grouped by their area, biggest area first; a café with no area is left out of this
// list rather than filed under an invented one.
function groupByArea(cafes: CafeListing[]): { area: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const cafe of cafes) {
    if (cafe.area) counts.set(cafe.area, (counts.get(cafe.area) ?? 0) + 1);
  }
  return [...counts]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count || a.area.localeCompare(b.area));
}

const HOME_LINKS = [
  { label: 'Explore teas', href: PAGE_ROUTES.EXPLORE },
  { label: 'Top teas', href: topTeasHref() },
  { label: 'Learn', href: PAGE_ROUTES.LEARN },
  { label: 'Regions', href: PAGE_ROUTES.REGIONS },
] as const;

export default async function Home({ searchParams }: HomeProps) {
  // Ratings are live, so the page renders per request. Without this Next may prerender it at
  // build time, and a build without Supabase env vars (CI, Vercel Preview) fails in supabaseEnv().
  await connection();
  const query = await searchParams;
  const jar = await cookies();
  const city = resolveCity(first(query.city), jar.get(CITY_COOKIE)?.value);
  const cityName = cityBySlug(city)?.name ?? city;

  const supabase = await createClient();
  const [tasterReviews, topLattes, cafes, feed] = await Promise.all([
    listLatestTasterDrinkReviews(supabase, { city, limit: RAIL_SIZE }),
    listTopDrinks(supabase, { city, base: 'hojicha', style: 'latte', limit: TOP_SIZE }),
    listCafes(supabase, { city }),
    loadFollowingFeed(),
  ]);
  const areas = groupByArea(cafes);
  const nothingYet = tasterReviews.length === 0 && topLattes.length === 0 && cafes.length === 0;

  return (
    <>
      <section className="max-w-site mx-auto w-full px-6 pt-12 pb-4 text-center sm:pt-20 sm:pb-10">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          The trusted guide to hojicha and matcha drinks in Singapore and JB
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-lg">
          Rated drink by drink, by tasters you can follow.
        </p>
        <div className="mt-8 flex justify-center">
          <CitySwitch current={city} />
        </div>
      </section>

      <div className="max-w-site mx-auto w-full space-y-14 px-6 pt-6 pb-16 sm:pb-24">
        {tasterReviews.length > 0 && (
          <section aria-labelledby="latest-tasters" className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="latest-tasters" className="text-2xl font-bold tracking-tight">
                Latest from our tasters
              </h2>
              <Link
                href={PAGE_ROUTES.TASTERS}
                className="text-brand shrink-0 text-sm font-semibold hover:underline"
              >
                Meet the tasters
              </Link>
            </div>
            <ul className="grid gap-4 md:grid-cols-3">
              {tasterReviews.map(({ review, drink }) => (
                <li key={review.id}>
                  <ReviewItem
                    review={review}
                    category={drink.base}
                    footer={
                      <Link
                        href={drinkHref(drink.cafe.slug, drink.slug)}
                        className="text-sm font-semibold underline underline-offset-4"
                      >
                        {drink.name} · {drink.cafe.name}
                      </Link>
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {topLattes.length > 0 && (
          <section aria-labelledby="top-lattes" className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="top-lattes" className="text-2xl font-bold tracking-tight">
                Top hojicha lattes in {cityName}
              </h2>
              <Link
                href={topDrinksHref({ city, base: 'hojicha', style: 'latte' })}
                className="text-brand shrink-0 text-sm font-semibold hover:underline"
              >
                See all
              </Link>
            </div>
            <ol className="grid gap-4 md:grid-cols-2">
              {topLattes.map((drink) => (
                <li key={drink.id}>
                  <DrinkRow drink={drink} showCafe />
                </li>
              ))}
            </ol>
          </section>
        )}

        {areas.length > 0 && (
          <section aria-labelledby="cafes-by-area" className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="cafes-by-area" className="text-2xl font-bold tracking-tight">
                Cafés by area
              </h2>
              <Link
                href={`${PAGE_ROUTES.CAFES}?city=${city}`}
                className="text-brand shrink-0 text-sm font-semibold hover:underline"
              >
                All cafés
              </Link>
            </div>
            <ul className="flex flex-wrap gap-2">
              {areas.map(({ area, count }) => (
                <li key={area}>
                  <Link
                    href={`${PAGE_ROUTES.CAFES}?city=${city}&area=${encodeURIComponent(area)}`}
                    className="border-border hover:bg-muted inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold"
                  >
                    {area}
                    <span className="text-muted-foreground font-normal">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {nothingYet && (
          <section
            aria-labelledby="first-drink"
            className="bg-muted flex-center flex-col gap-4 rounded-3xl px-6 py-16 text-center"
          >
            <h2 id="first-drink" className="text-2xl font-bold tracking-tight">
              No drinks rated in {cityName} yet
            </h2>
            <p className="text-muted-foreground max-w-sm">
              Be the first. Log a hojicha or matcha drink you&rsquo;ve had and it starts the list.
            </p>
            <LogDialog
              trigger={
                <Button className="min-h-11">
                  <Plus aria-hidden="true" />
                  Log a drink
                </Button>
              }
            />
          </section>
        )}

        {feed.length > 0 && (
          <section aria-labelledby="feed" className="space-y-4">
            <h2 id="feed" className="text-2xl font-bold tracking-tight">
              From people you follow
            </h2>
            <TastingFeed tastings={feed} />
          </section>
        )}

        <section aria-labelledby="at-home" className="space-y-4">
          <h2 id="at-home" className="text-2xl font-bold tracking-tight">
            Brew it at home
          </h2>
          <ul className="flex flex-wrap gap-2">
            {HOME_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="border-border hover:bg-muted inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
