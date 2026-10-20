import { notFound } from 'next/navigation';

import { WantToTryButton } from '@/features/journal';
import {
  CategoryBadge,
  ProductImageWell,
  ScoreNumeral,
  Stars,
  getProduct,
} from '@/features/products';
import {
  ProductInsights,
  RateProductForm,
  ReviewList,
  listReviews,
  summarizeReviews,
} from '@/features/reviews';
import { shouldUseMockData } from '@/integrations/supabase/is-configured';
import { getMockProduct, getMockReviews } from '@/integrations/supabase/mock-data';
import { createClient } from '@/integrations/supabase/server';

function reviewCountLabel(count: number): string {
  if (count === 0) return 'Not yet rated';
  return `${count} ${count === 1 ? 'review' : 'reviews'}`;
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

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <div className="grid gap-6 sm:grid-cols-[14rem_1fr] sm:gap-10">
        <ProductImageWell
          imageUrl={product.imageUrl}
          category={product.category}
          name={product.name}
          className="aspect-square w-full max-w-56 rounded-lg border"
        />
        <div className="flex flex-col justify-center">
          <CategoryBadge category={product.category} className="self-start" />
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
          {product.brand && <p className="text-muted-foreground mt-1 text-lg">{product.brand}</p>}
          {(product.grade || product.regionName) && (
            <p className="text-muted-foreground mt-1 text-sm">
              {[product.grade, product.regionName].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="mt-5 flex items-center gap-4">
            <ScoreNumeral value={product.avgStars} size="lg" />
            <div className="space-y-1">
              {product.avgStars !== null && (
                <Stars value={product.avgStars} category={product.category} />
              )}
              <p className="text-muted-foreground text-sm">
                {reviewCountLabel(product.reviewCount)}
              </p>
            </div>
          </div>
          <WantToTryButton productId={product.id} className="mt-5 self-start" />
        </div>
      </div>

      <div className="mt-10">
        <ProductInsights summary={summarizeReviews(reviews)} category={product.category} />
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section
          id="rate"
          aria-labelledby="rate-heading"
          className="scroll-mt-24 lg:order-2 lg:self-start"
        >
          <h2 id="rate-heading" className="text-lg font-semibold">
            Rate it
          </h2>
          <div className="bg-card mt-4 rounded-lg border p-5">
            <RateProductForm
              product={{
                id: product.id,
                name: product.name,
                brand: product.brand,
                category: product.category,
              }}
            />
          </div>
        </section>
        <section aria-labelledby="reviews-heading" className="lg:order-1">
          <h2 id="reviews-heading" className="text-lg font-semibold">
            Reviews
          </h2>
          <div className="mt-4">
            <ReviewList reviews={reviews} category={product.category} />
          </div>
        </section>
      </div>
    </div>
  );
}
