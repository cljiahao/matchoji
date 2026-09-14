import { CategoryTabs, EmptyState, ProductGrid, listProducts } from '@/features/products';
import { LogTastingDialog } from '@/features/reviews';
import { isSupabaseConfigured } from '@/integrations/supabase/is-configured';
import { getMockProducts } from '@/integrations/supabase/mock-data';
import { createClient } from '@/integrations/supabase/server';

interface HomePageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const { category } = await searchParams;
  const activeCategory = category === 'matcha' || category === 'hojicha' ? category : undefined;

  const products = isSupabaseConfigured()
    ? await listProducts(await createClient(), activeCategory)
    : getMockProducts(activeCategory);

  return (
    <div className="max-w-site mx-auto w-full px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
          <p className="text-muted-foreground mt-1">
            Rate and discover hojicha and matcha, one cup at a time.
          </p>
        </div>
        <LogTastingDialog />
      </div>

      <div className="mt-6">
        <CategoryTabs active={activeCategory} />
      </div>

      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyState>
            <LogTastingDialog />
          </EmptyState>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}
