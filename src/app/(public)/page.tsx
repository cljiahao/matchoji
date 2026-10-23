import { connection } from 'next/server';

import { WantToTryButton } from '@/features/journal';
import {
  CategoryCircles,
  ProductShelf,
  SearchPill,
  listProducts,
  type DiscoverFilters,
  type Product,
} from '@/features/products';
import { LogTastingDialog } from '@/features/reviews';
import { TastingFeed, loadFeed, type Tasting } from '@/features/social';
import { createClient } from '@/integrations/supabase/server';

const SHELF_SIZE = 12;

const SHELVES: { title: string; filters: DiscoverFilters; href: string }[] = [
  {
    title: 'Top-rated matcha',
    filters: { category: 'matcha', sort: 'top' },
    href: '/explore?category=matcha',
  },
  {
    title: 'Top-rated hojicha',
    filters: { category: 'hojicha', sort: 'top' },
    href: '/explore?category=hojicha',
  },
  { title: 'Newly added', filters: { sort: 'newest' }, href: '/explore?sort=newest' },
];

// Signed-in readers who follow people see their latest tastings first, as on Vivino.
async function loadFollowingFeed(): Promise<Tasting[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? loadFeed(supabase) : [];
}

// Each shelf fetches only the teas it shows.
async function loadShelves(): Promise<Product[][]> {
  const supabase = await createClient();
  const pages = await Promise.all(
    SHELVES.map(({ filters }) => listProducts(supabase, filters, { limit: SHELF_SIZE }))
  );
  return pages.map((p) => p.products);
}

export default async function Home() {
  // Shelves are live ratings, so the page renders per request. Without this Next may
  // prerender it at build time, and a build without Supabase env vars (CI, Vercel Preview)
  // fails in supabaseEnv().
  await connection();
  const [shelves, feed] = await Promise.all([loadShelves(), loadFollowingFeed()]);
  const empty = shelves.every((products) => products.length === 0);
  // On a small catalogue "Newly added" would only repeat the two shelves above; it earns its
  // place once it holds a tea they don't show.
  const shown = new Set(
    shelves.slice(0, 2).flatMap((s) => s.slice(0, SHELF_SIZE).map((p) => p.id))
  );
  const newest = shelves[2].slice(0, SHELF_SIZE);
  if (newest.every((p) => shown.has(p.id))) shelves[2] = [];

  return (
    <>
      <section className="max-w-site mx-auto w-full px-6 pt-12 pb-10 text-center sm:pt-20">
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Find your next matcha or hojicha
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-lg">
          Ratings, tasting notes and brewing tips from people who drink it.
        </p>
        <SearchPill size="lg" className="mx-auto mt-8 max-w-xl" />
        <CategoryCircles className="mt-12" />
      </section>

      <div className="max-w-site mx-auto w-full space-y-14 px-6 pt-6 pb-16 sm:pb-24">
        {feed.length > 0 && (
          <section aria-labelledby="feed" className="space-y-4">
            <h2 id="feed" className="text-2xl font-bold tracking-tight">
              From people you follow
            </h2>
            <TastingFeed tastings={feed} />
          </section>
        )}
        {empty ? (
          <div className="bg-muted flex-center flex-col gap-4 rounded-3xl px-6 py-16 text-center">
            <h2 className="text-2xl font-bold tracking-tight">No teas rated yet</h2>
            <p className="text-muted-foreground max-w-sm">
              Be the first. Log a matcha or hojicha you&rsquo;ve tried and it starts the shelf.
            </p>
            <LogTastingDialog />
          </div>
        ) : (
          SHELVES.map((shelf, i) => (
            <ProductShelf
              key={shelf.title}
              title={shelf.title}
              seeAllHref={shelf.href}
              products={shelves[i].slice(0, SHELF_SIZE)}
              renderAction={(product) => <WantToTryButton productId={product.id} compact />}
            />
          ))
        )}
      </div>
    </>
  );
}
