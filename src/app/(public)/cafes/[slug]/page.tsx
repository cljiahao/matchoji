import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';

import { TeaMap } from '@/components/widgets/tea-map';
import {
  DrinkRow,
  ScorePair,
  SlugSchema,
  cityBySlug,
  drinkHref,
  getCafePage,
  latestTasterReviews,
} from '@/features/cafes';
import { ReviewItem } from '@/features/reviews';
import { cafeJsonLd, cafeMetadata, serializeJsonLd } from '@/features/share';
import { createClient } from '@/integrations/supabase/server';

interface CafePageProps {
  params: Promise<{ slug: string }>;
}

// One read per request, shared by the page and its metadata.
const loadCafe = cache(async (slug: string) => getCafePage(await createClient(), slug));

export async function generateMetadata({ params }: CafePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = SlugSchema.safeParse(slug).success ? await loadCafe(slug) : null;
  if (page?.kind !== 'found') return { title: 'Café not found' };
  const { cafe, scores, drinks } = page;
  return cafeMetadata({
    slug: cafe.slug,
    name: cafe.name,
    area: cafe.area,
    cityName: cityBySlug(cafe.citySlug)?.name ?? '',
    drinkCount: drinks.length,
    status: cafe.status,
    tasterAvg: scores.tasterAvg,
    tasterCount: scores.tasterCount,
  });
}

export default async function CafePage({ params }: CafePageProps) {
  const { slug } = await params;
  if (!SlugSchema.safeParse(slug).success) notFound();

  const page = await loadCafe(slug);
  if (page.kind === 'missing') notFound();
  // A merged café forwards to the one that absorbed it, so a link posted to Instagram still lands.
  if (page.kind === 'redirect') permanentRedirect(page.to);

  const { cafe, scores, drinks } = page;
  const cityName = cityBySlug(cafe.citySlug)?.name ?? '';
  const tasterReviews = await latestTasterReviews(await createClient(), drinks);
  const listed = cafe.status === 'approved';

  return (
    <>
      {listed && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              cafeJsonLd({
                name: cafe.name,
                address: cafe.address,
                lat: cafe.lat,
                lng: cafe.lng,
                instagramHandle: cafe.instagramHandle,
                websiteUrl: cafe.websiteUrl,
                tasterAvg: scores.tasterAvg,
                tasterCount: scores.tasterCount,
              })
            ),
          }}
        />
      )}
      <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
        <p className="text-muted-foreground text-sm font-medium">
          <Link
            href={`/cafes?city=${cafe.citySlug}`}
            className="underline-offset-4 hover:underline"
          >
            Cafés
          </Link>
          {cityName && ` · ${cityName}`}
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          {cafe.name}
        </h1>
        <p className="text-muted-foreground mt-2">
          {[cafe.area, cafe.address].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          {cafe.instagramHandle && (
            <a
              href={`https://www.instagram.com/${cafe.instagramHandle}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              @{cafe.instagramHandle}
            </a>
          )}
          {cafe.websiteUrl && (
            <a
              href={cafe.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              Website
            </a>
          )}
        </p>
        <ScorePair scores={scores} className="mt-6" />

        {cafe.lat !== null && cafe.lng !== null && (
          <TeaMap
            label={`Map of ${cafe.name}`}
            pins={[
              {
                id: cafe.id,
                lat: cafe.lat,
                lng: cafe.lng,
                name: cafe.name,
                tone: 'neutral',
                description: cafe.address ?? undefined,
              },
            ]}
            className="mt-8 h-56 sm:h-72"
          />
        )}

        <section aria-labelledby="cafe-drinks" className="mt-10">
          <h2 id="cafe-drinks" className="text-2xl font-bold tracking-tight">
            Drinks
          </h2>
          {drinks.length > 0 ? (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {drinks.map((drink) => (
                <li key={drink.id}>
                  <DrinkRow drink={drink} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="bg-muted text-muted-foreground mt-4 rounded-3xl px-6 py-12 text-center">
              No drinks listed here yet.
            </p>
          )}
        </section>

        {tasterReviews.length > 0 && (
          <section aria-labelledby="cafe-tasters" className="mt-10">
            <h2 id="cafe-tasters" className="text-2xl font-bold tracking-tight">
              Latest from trusted tasters
            </h2>
            <ul className="mt-4 space-y-4">
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
                        {drink.name}
                      </Link>
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
