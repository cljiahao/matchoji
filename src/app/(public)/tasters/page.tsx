import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';

import { drinkHref } from '@/features/reviews';
import { InstagramHandleLink, TrustedTasterBadge, listTasters } from '@/features/social';
import { createClient } from '@/integrations/supabase/server';
import { PAGE_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = {
  title: 'Trusted tasters',
  description: 'The people whose hojicha and matcha drink reviews lead Matchoji’s drink pages.',
};

export default async function TastersPage() {
  // Tasters are granted by an admin at any time, so this opts out of prerendering.
  await connection();
  const tasters = await listTasters(await createClient());

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Trusted tasters</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">
        Invited tasters rate hojicha and matcha drinks and link their Instagram posts. Their scores
        sit apart from community ratings.{' '}
        <Link href={PAGE_ROUTES.HOW_WE_RATE} className="underline underline-offset-2">
          How we rate
        </Link>
      </p>
      {tasters.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasters.map((taster) => (
            <li key={taster.id} className="border-border space-y-3 rounded-2xl border p-5">
              <div className="space-y-2">
                <h2 className="text-lg font-bold tracking-tight">
                  <Link href={`/u/${taster.id}`} className="hover:underline">
                    {taster.name}
                  </Link>
                </h2>
                <TrustedTasterBadge />
              </div>
              {taster.bio && <p className="line-clamp-3 text-sm">{taster.bio}</p>}
              {taster.instagramHandle && <InstagramHandleLink handle={taster.instagramHandle} />}
              <p className="text-muted-foreground text-sm">
                {taster.drinkReviewCount} {taster.drinkReviewCount === 1 ? 'drink' : 'drinks'} rated
                {taster.latest && (
                  <>
                    {' · latest: '}
                    <Link
                      href={drinkHref(taster.latest.drink.cafe.slug, taster.latest.drink.slug)}
                      className="underline underline-offset-2"
                    >
                      {taster.latest.drink.name}
                    </Link>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="bg-muted text-muted-foreground mt-8 rounded-3xl px-6 py-10 text-center">
          No trusted tasters yet.
        </p>
      )}
    </div>
  );
}
