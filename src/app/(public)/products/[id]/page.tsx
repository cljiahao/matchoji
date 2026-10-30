import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import { z } from 'zod';

import { FreshnessHint, WantToTryButton, getStash } from '@/features/journal';
import { WhereToBuy, listProductOffers } from '@/features/marketplace';
import {
  CATEGORY_STYLES,
  CategoryBadge,
  ProductFacts,
  ProductImageWell,
  ScoreNumeral,
  Stars,
  getProduct,
} from '@/features/products';
import {
  CommunityReviews,
  EditionList,
  ProductInsights,
  RateThisTea,
  listEditions,
  listReviews,
  localToday,
  summarizeReviews,
} from '@/features/reviews';
import { ReviewReactions, loadReactions } from '@/features/social';
import { StockPanel, getLatestStockReport } from '@/features/stock';
import { MatchSummary, loadMatches } from '@/features/taste';
import { createClient } from '@/integrations/supabase/server';
import { cn } from '@/lib/utils';

function ratingCountLabel(count: number): string {
  if (count === 0) return 'Not yet rated';
  return `${count} ${count === 1 ? 'rating' : 'ratings'}`;
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

const isTeaId = (id: string) => z.uuid().safeParse(id).success;

// One read per request, shared by the page and its metadata.
const loadProduct = cache(async (id: string) => getProduct(await createClient(), id));

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = isTeaId(id) ? await loadProduct(id) : null;
  if (!product) return { title: 'Tea not found' };
  const title = product.brand ? `${product.name} · ${product.brand}` : product.name;
  const rating =
    product.avgStars === null
      ? 'Not yet rated'
      : `${product.avgStars.toFixed(1)} out of 5 from ${product.reviewCount} ratings`;
  const description = `${title}: ${product.category}. ${rating} on Matchoji.`;
  return {
    title,
    description,
    // Teas outside the catalogue are shareable by link but kept out of search engines.
    robots: product.status === 'approved' ? undefined : { index: false },
    openGraph: {
      title,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  // A malformed id would make Postgres reject the query; it is simply not a tea.
  if (!isTeaId(id)) notFound();

  const supabase = await createClient();
  const [product, reviews, stockReport, offers, { data: auth }, editions] = await Promise.all([
    loadProduct(id),
    listReviews(supabase, id),
    getLatestStockReport(supabase, id),
    listProductOffers(supabase, id),
    supabase.auth.getUser(),
    listEditions(supabase, id),
  ]);

  if (!product) notFound();
  // A merged duplicate forwards to the tea it repeated, so old links and shares still land.
  if (product.mergedInto) permanentRedirect(`/products/${product.mergedInto}`);

  // Buying and stock belong to catalogue teas. A tea awaiting review can be rated and saved
  // only by whoever added it (the database enforces the same rule); a rejected one by nobody.
  // Signed-in tasters see how well the tea suits them, unless they've rated it themselves.
  const taste = auth.user ? await loadMatches(supabase, auth.user.id, [product.id]) : null;
  const rated = taste?.ownStars.has(product.id) ?? false;
  const stash = auth.user ? await getStash(supabase, auth.user.id, product.id) : null;

  const listed = product.status === 'approved';
  const canEngage =
    listed ||
    (product.status === 'pending' && auth.user != null && auth.user.id === product.addedBy);

  const reactions = await loadReactions(
    supabase,
    reviews.map((r) => r.id),
    auth.user?.id ?? null
  );
  const footers = Object.fromEntries(
    reviews.map((r) => [
      r.id,
      <ReviewReactions
        key={r.id}
        reviewId={r.id}
        reviewAuthorId={r.authorId}
        initial={reactions[r.id]}
      />,
    ])
  );

  const summary = summarizeReviews(reviews);
  const productSummary = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
  };

  return (
    <>
      <div className={cn(CATEGORY_STYLES[product.category].band)}>
        <div className="max-w-site mx-auto grid w-full gap-8 px-6 py-10 sm:grid-cols-[minmax(0,18rem)_1fr] sm:gap-12 sm:py-14 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div>
            <ProductImageWell
              imageUrl={product.imageUrl}
              category={product.category}
              name={product.name}
              seed={product.id}
              mark={product.brand ?? product.name}
              className="bg-background/70 mx-auto aspect-square w-full max-w-60 sm:mx-0 sm:max-w-none"
            />
            {product.imageUrl && product.imageCredit && (
              <p className="text-muted-foreground mx-auto mt-2 max-w-60 text-xs sm:mx-0 sm:max-w-none">
                Photo: {product.imageCredit}
              </p>
            )}
          </div>
          <div className="flex flex-col justify-center">
            {product.brand && <p className="text-lg font-medium">{product.brand}</p>}
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {product.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <CategoryBadge category={product.category} />
              {product.grade && (
                <span className="bg-background rounded-full px-2.5 py-0.5">{product.grade}</span>
              )}
              {product.regionName && (
                <span className="bg-background rounded-full px-2.5 py-0.5">
                  {product.regionName}
                </span>
              )}
            </div>
            {product.status !== 'approved' && (
              // Like Vivino's "processing" label on an unmatched scan: the tea can be rated
              // and shared, but it is not in Explore or search until someone checks it.
              <p className="bg-background mt-4 max-w-md rounded-2xl px-4 py-3 text-sm">
                {product.status === 'pending' ? (
                  <>
                    <span className="font-semibold">Awaiting review.</span> A taster added this tea;
                    it joins Explore and search once we&apos;ve checked it.
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Not added to the catalogue.</span>{' '}
                    {product.reviewNote ??
                      'We couldn’t confirm this tea, often because it duplicates another.'}{' '}
                    Your tastings of it are still in your journal.
                  </>
                )}
              </p>
            )}

            <div className="mt-6 flex items-center gap-4">
              <ScoreNumeral value={product.avgStars} size="lg" />
              <div className="space-y-1">
                {product.avgStars !== null && (
                  <Stars value={product.avgStars} category={product.category} />
                )}
                <p className="text-muted-foreground text-sm">
                  {ratingCountLabel(product.reviewCount)}
                </p>
              </div>
            </div>

            {taste && !rated && (
              <MatchSummary
                match={taste.matches.get(product.id)}
                hasRatings={taste.hasRatings}
                className="mt-4"
              />
            )}

            {canEngage && (
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div>
                  <p className="text-sm font-semibold">Rate it</p>
                  <RateThisTea product={productSummary} className="-ml-0.5" />
                </div>
                <WantToTryButton productId={product.id} className="bg-background" />
              </div>
            )}

            {stash?.openedOn && (
              <div className="mt-4">
                <FreshnessHint
                  brand={product.brand}
                  openedOn={stash.openedOn}
                  today={localToday()}
                />
              </div>
            )}

            {listed && (
              <StockPanel
                productId={product.id}
                brand={product.brand}
                shopUrl={product.shopUrl}
                initialReport={stockReport}
                className="mt-6"
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-site mx-auto w-full space-y-16 px-6 py-12 sm:py-16">
        <ProductInsights summary={summary} category={product.category} productName={product.name} />
        {listed && <WhereToBuy offers={offers} />}
        <EditionList editions={editions} />
        <ProductFacts product={product} />
        {summary.photos.length > 0 && (
          <section aria-labelledby="photos-heading">
            <h2 id="photos-heading" className="text-2xl font-bold tracking-tight">
              Photos
            </h2>
            <ul className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
              {summary.photos.map((url, i) => (
                <li key={url} className="shrink-0">
                  {/* Storage host is per-project, so next/image remotePatterns can't be fixed here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Tasting photo ${i + 1}`}
                    className="h-36 w-36 rounded-2xl object-cover"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
        <CommunityReviews
          product={productSummary}
          canRate={canEngage}
          footers={footers}
          avgStars={product.avgStars}
          reviews={reviews}
          summary={summary}
        />
      </div>
    </>
  );
}
