import { notFound } from 'next/navigation';

import { CategoryBadge, StarRatingDisplay, getProduct } from '@/features/products';
import { RateProductForm, ReviewList, listReviews } from '@/features/reviews';
import { shouldUseMockData } from '@/integrations/supabase/is-configured';
import { getMockProduct, getMockReviews } from '@/integrations/supabase/mock-data';
import { createClient } from '@/integrations/supabase/server';

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
    <div className="max-w-site mx-auto w-full px-6 py-12">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
        <CategoryBadge category={product.category} />
      </div>
      {product.brand && <p className="text-muted-foreground mt-1">{product.brand}</p>}
      {(product.grade || product.regionName) && (
        <p className="text-muted-foreground mt-1 text-sm">
          {[product.grade, product.regionName].filter(Boolean).join(' · ')}
        </p>
      )}
      <StarRatingDisplay
        avgStars={product.avgStars}
        reviewCount={product.reviewCount}
        category={product.category}
        className="mt-3"
      />

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section
          id="rate"
          aria-labelledby="rate-heading"
          className="scroll-mt-24 lg:order-2 lg:self-start"
        >
          <h2 id="rate-heading" className="text-lg font-semibold">
            Rate it
          </h2>
          <div className="mt-4">
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
