import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';

import { TopListCard, buildTopLists } from '@/features/discovery';
import { listCatalogue } from '@/features/products';
import { createClient } from '@/integrations/supabase/server';

export const metadata: Metadata = {
  title: 'Top lists',
  description: 'The best-rated and best-value matcha and hojicha on Matchoji.',
};

export default async function TopIndexPage() {
  // Lists are live ratings; see the home page for why this opts out of prerendering.
  await connection();
  const lists = buildTopLists(await listCatalogue(await createClient()));

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Top lists</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">
        Ranked by rating, weighted by how many people rated each tea. A list appears once enough
        teas have enough ratings.
      </p>
      {lists.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <li key={list.slug}>
              <TopListCard list={list} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-muted flex-center mt-8 flex-col gap-3 rounded-3xl px-6 py-16 text-center">
          <p className="text-muted-foreground max-w-sm">
            No top lists yet. They appear once at least five teas have three ratings each.
          </p>
          <Link href="/explore" className="text-brand text-sm font-semibold hover:underline">
            Explore teas
          </Link>
        </div>
      )}
    </div>
  );
}
