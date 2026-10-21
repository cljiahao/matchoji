import { notFound } from 'next/navigation';

import { WantToTryButton } from '@/features/journal';
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
  ProductInsights,
  RateThisTea,
  listReviews,
  summarizeReviews,
} from '@/features/reviews';
import { shouldUseMockData } from '@/integrations/supabase/is-configured';
import { getMockProduct, getMockReviews } from '@/integrations/supabase/mock-data';
import { createClient } from '@/integrations/supabase/server';
import { cn } from '@/lib/utils';

function ratingCountLabel(count: number): string {
  if (count === 0) return 'Not yet rated';
  return `${count} ${count === 1 ? 'rating' : 'ratings'}`;
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const [product, reviews] = shouldUseMockData()
    ? ([getMockProduct(id), getMockReviews(id)] as const)
    : await (async () => {
        const supabase = await createClient();
        return Promise.all([getProduct(supabase, id), listReviews(supabase, id)]);
      })();

  if (!product) notFound();

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
          <ProductImageWell
            imageUrl={product.imageUrl}
            category={product.category}
            name={product.name}
            seed={product.id}
            mark={product.brand ?? product.name}
            className="mx-auto aspect-square w-full max-w-60 bg-white/70 sm:mx-0 sm:max-w-none"
          />
          <div className="flex flex-col justify-center">
            {product.brand && <p className="text-lg font-medium">{product.brand}</p>}
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {product.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <CategoryBadge category={product.category} />
              {product.grade && (
                <span className="rounded-full bg-white px-2.5 py-0.5">{product.grade}</span>
              )}
              {product.regionName && (
                <span className="rounded-full bg-white px-2.5 py-0.5">{product.regionName}</span>
              )}
            </div>

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

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div>
                <p className="text-sm font-semibold">Rate it</p>
                <RateThisTea product={productSummary} className="-ml-0.5" />
              </div>
              <WantToTryButton productId={product.id} className="bg-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-site mx-auto w-full space-y-16 px-6 py-12 sm:py-16">
        <ProductInsights summary={summary} category={product.category} productName={product.name} />
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
          avgStars={product.avgStars}
          reviews={reviews}
          summary={summary}
        />
      </div>
    </>
  );
}
