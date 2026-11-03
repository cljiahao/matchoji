import type { Metadata } from 'next';
import { connection } from 'next/server';

import { ShopsExplorer, listShops } from '@/features/shops';
import { createClient } from '@/integrations/supabase/server';

export const metadata: Metadata = { title: 'Where to buy in person' };

interface ShopsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ShopsPage({ searchParams }: ShopsPageProps) {
  // Read per request, like the regions page, so builds need no database.
  await connection();
  const { brand } = await searchParams;
  const shops = await listShops(await createClient());

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Where to buy in person</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">
        Makers&apos; own stores and shops that stock them. Each address comes from the shop&apos;s
        own site, linked as its source; pins are approximate to the building. The list below the map
        has the same shops.
      </p>
      <div className="mt-6">
        {shops.length > 0 ? (
          <ShopsExplorer shops={shops} initialBrand={typeof brand === 'string' ? brand : ''} />
        ) : (
          <p className="bg-muted text-muted-foreground rounded-3xl py-16 text-center">
            No shops listed yet.
          </p>
        )}
      </div>
    </div>
  );
}
