import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { AddCafeCta } from '@/components/widgets/log-dialog';
import { TeaMap } from '@/components/widgets/tea-map';
import {
  CITY_COOKIE,
  CafeCard,
  CafeFilters,
  type CitySlug,
  CitySwitch,
  cafePins,
  cityBySlug,
  cityHref,
  listCafes,
  resolveCity,
} from '@/features/cafes';
import { createClient } from '@/integrations/supabase/server';
import { PAGE_ROUTES } from '@/lib/constants/routes';

interface CafesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (value: string | string[] | undefined) =>
  typeof value === 'string' ? value : undefined;

const loadCityCafes = cache(async (city: CitySlug) => listCafes(await createClient(), { city }));

// The city reaches the page as a cookie as well as a query, so one URL serves both cities; the
// canonical names the query form, which makes each city's list its own indexable page. Filtered
// views fold into it. A city with no café is a thin page, so it stays out of search until it has one.
export async function generateMetadata({ searchParams }: CafesPageProps): Promise<Metadata> {
  const query = await searchParams;
  const jar = await cookies();
  const city = resolveCity(first(query.city), jar.get(CITY_COOKIE)?.value);
  const cafes = await loadCityCafes(city);
  return {
    title: 'Cafés for hojicha and matcha drinks',
    description:
      'Where to drink hojicha and matcha in Singapore and Johor Bahru, rated drink by drink by trusted tasters.',
    alternates: { canonical: cityHref(PAGE_ROUTES.CAFES, city) },
    ...(cafes.length === 0 && { robots: { index: false } }),
  };
}

export default async function CafesPage({ searchParams }: CafesPageProps) {
  const query = await searchParams;
  const jar = await cookies();
  const city = resolveCity(first(query.city), jar.get(CITY_COOKIE)?.value);
  const cityName = cityBySlug(city)?.name ?? city;
  const area = first(query.area) || undefined;
  const tasterOnly = first(query.taster) === '1';

  // An unfiltered view is the list generateMetadata already read, so it shares that one query.
  const cafes =
    area || tasterOnly
      ? await listCafes(await createClient(), { city, area, tasterOnly })
      : await loadCityCafes(city);
  // The area list stays complete while an area is chosen, or the choice could not be undone.
  const everyCafe = area ? await loadCityCafes(city) : cafes;
  const areas = [...new Set(everyCafe.flatMap((c) => (c.area ? [c.area] : [])))].sort();

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Hojicha and matcha cafés
      </h1>
      <p className="text-muted-foreground mt-2 max-w-xl">
        Every drink rated on its own. Trusted tasters score first; the community&apos;s score sits
        beside it, never mixed in.
      </p>
      <div className="mt-6">
        <CitySwitch current={city} />
      </div>
      <div className="mt-6">
        <CafeFilters city={city} areas={areas} area={area} tasterOnly={tasterOnly} />
      </div>
      {cafes.length > 0 ? (
        <div className="mt-8 space-y-6">
          <TeaMap label={`Cafés in ${cityName}`} pins={cafePins(cafes)} className="h-72 sm:h-96" />
          <ul className="grid gap-4 sm:grid-cols-2">
            {cafes.map((cafe) => (
              <li key={cafe.id}>
                <CafeCard cafe={cafe} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-muted mt-8 flex flex-col items-center gap-4 rounded-3xl px-6 py-16 text-center">
          <p className="text-muted-foreground">
            {area || tasterOnly
              ? `No cafés match those filters in ${cityName}.`
              : `No cafés listed in ${cityName} yet.`}
          </p>
          {!area && !tasterOnly && (
            <>
              <p className="max-w-sm text-sm">
                Know a café serving hojicha or matcha? Add it and rate its drinks to start the list.
              </p>
              <AddCafeCta />
            </>
          )}
        </div>
      )}
    </div>
  );
}
