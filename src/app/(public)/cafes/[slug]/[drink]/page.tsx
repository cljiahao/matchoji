import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';

import {
  BASE_LABELS,
  DrinkRow,
  SERVING_LABELS,
  STYLE_LABELS,
  ScorePair,
  SlugSchema,
  cafeHref,
  formatPrice,
  getDrinkPage,
  listSimilarDrinks,
} from '@/features/cafes';
import { CATEGORY_STYLES } from '@/features/products';
import { ReviewItem } from '@/features/reviews';
import { drinkJsonLd, drinkMetadata, serializeJsonLd } from '@/features/share';
import { createClient } from '@/integrations/supabase/server';
import { cn } from '@/lib/utils';

interface DrinkPageProps {
  params: Promise<{ slug: string; drink: string }>;
}

const validSlugs = (slug: string, drink: string) =>
  SlugSchema.safeParse(slug).success && SlugSchema.safeParse(drink).success;

// One read per request, shared by the page and its metadata.
const loadDrink = cache(async (slug: string, drink: string) =>
  getDrinkPage(await createClient(), slug, drink)
);

export async function generateMetadata({ params }: DrinkPageProps): Promise<Metadata> {
  const { slug, drink: drinkSlug } = await params;
  const page = validSlugs(slug, drinkSlug) ? await loadDrink(slug, drinkSlug) : null;
  if (page?.kind !== 'found') return { title: 'Drink not found' };
  const { drink } = page;
  return drinkMetadata({
    slug: drink.slug,
    name: drink.name,
    cafeName: drink.cafe.name,
    cafeSlug: drink.cafe.slug,
    status: drink.status,
    tasterAvg: drink.scores.tasterAvg,
    tasterCount: drink.scores.tasterCount,
    communityAvg: drink.scores.communityAvg,
    communityCount: drink.scores.communityCount,
  });
}

export default async function DrinkPage({ params }: DrinkPageProps) {
  const { slug, drink: drinkSlug } = await params;
  if (!validSlugs(slug, drinkSlug)) notFound();

  const page = await loadDrink(slug, drinkSlug);
  if (page.kind === 'missing') notFound();
  // Merged and rejected drinks forward (to the survivor, or to the café) instead of 404ing.
  if (page.kind === 'redirect') permanentRedirect(page.to);

  const { drink, tasterReviews, communityReviews, teaProduct } = page;
  const similar = await listSimilarDrinks(await createClient(), drink, drink.cafe.citySlug);
  const facts = [
    STYLE_LABELS[drink.style],
    SERVING_LABELS[drink.serving],
    drink.price === null ? null : formatPrice(drink.price, drink.currency),
  ].filter((fact): fact is string => fact !== null);
  const noReviews = tasterReviews.length === 0 && communityReviews.length === 0;

  return (
    <>
      {drink.status === 'approved' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              drinkJsonLd({
                name: drink.name,
                slug: drink.slug,
                cafeName: drink.cafe.name,
                cafeSlug: drink.cafe.slug,
              })
            ),
          }}
        />
      )}
      <div className={cn(CATEGORY_STYLES[drink.base].band)}>
        <div className="max-w-site mx-auto w-full px-6 py-8 sm:py-14">
          <p className="text-sm font-medium">
            <Link href={cafeHref(drink.cafe.slug)} className="underline-offset-4 hover:underline">
              {drink.cafe.name}
            </Link>
            {drink.cafe.area && ` · ${drink.cafe.area}`}
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            {drink.name}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="bg-background rounded-full px-2.5 py-0.5 font-semibold">
              {BASE_LABELS[drink.base]}
            </span>
            {facts.map((fact) => (
              <span key={fact} className="bg-background rounded-full px-2.5 py-0.5">
                {fact}
              </span>
            ))}
          </p>
          {drink.photoUrl && (
            <figure className="mt-5">
              {/* Remote hosts are not configured for next/image, so this stays a plain img. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={drink.photoUrl}
                alt={`${drink.name} at ${drink.cafe.name}`}
                width={640}
                height={480}
                className="h-auto max-h-80 w-full max-w-xl rounded-3xl object-cover"
              />
              {drink.photoCredit && (
                <figcaption className="text-muted-foreground mt-2 text-xs">
                  Photo: {drink.photoCredit}
                </figcaption>
              )}
            </figure>
          )}
        </div>
      </div>

      <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
        <ScorePair scores={drink.scores} />

        {teaProduct && (
          <p className="mt-6 text-sm">
            <span className="text-muted-foreground">Tea used here: </span>
            <Link href={`/products/${teaProduct.id}`} className="font-semibold underline">
              {teaProduct.name}
            </Link>
          </p>
        )}

        {tasterReviews.length > 0 && (
          <section aria-labelledby="drink-tasters" className="mt-10">
            <h2 id="drink-tasters" className="text-2xl font-bold tracking-tight">
              Trusted tasters
            </h2>
            <ul className="mt-4 space-y-4">
              {tasterReviews.map((review) => (
                <li key={review.id}>
                  <ReviewItem review={review} category={drink.base} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {communityReviews.length > 0 && (
          <section aria-labelledby="drink-community" className="mt-10">
            <h2 id="drink-community" className="text-2xl font-bold tracking-tight">
              Community
            </h2>
            <ul className="mt-4 space-y-4">
              {communityReviews.map((review) => (
                <li key={review.id}>
                  <ReviewItem review={review} category={drink.base} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {noReviews && (
          <p className="bg-muted text-muted-foreground mt-10 rounded-3xl px-6 py-12 text-center">
            No reviews yet.
          </p>
        )}

        {similar.length > 0 && (
          <section aria-labelledby="drink-similar" className="mt-10">
            <h2 id="drink-similar" className="text-2xl font-bold tracking-tight">
              Similar drinks
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {similar.map((d) => (
                <li key={d.id}>
                  <DrinkRow drink={d} showCafe />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
