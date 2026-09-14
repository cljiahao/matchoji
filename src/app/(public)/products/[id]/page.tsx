import { notFound } from 'next/navigation';

import { CategoryBadge, StarRatingDisplay, getProduct } from '@/features/products';
import { LogTastingDialog, ReviewList, listReviews } from '@/features/reviews';
import { isSupabaseConfigured } from '@/integrations/supabase/is-configured';
import { getMockProduct, getMockReviews } from '@/integrations/supabase/mock-data';
import { createClient } from '@/integrations/supabase/server';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const [product, reviews] = isSupabaseConfigured()
    ? await (async () => {
        const supabase = await createClient();
        return [await getProduct(supabase, id), await listReviews(supabase, id)] as const;
      })()
    : ([getMockProduct(id), getMockReviews(id)] as const);

  if (!product) notFound();

  return (
    <div className="max-w-content mx-auto w-full px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
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
            className="mt-3"
          />
        </div>
        <LogTastingDialog
          initialProduct={{
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
          }}
        />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <div className="mt-4">
          <ReviewList reviews={reviews} />
        </div>
      </div>
    </div>
  );
}
