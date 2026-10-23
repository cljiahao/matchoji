import type { Metadata } from 'next';
import { connection } from 'next/server';

import { SignInButton } from '@/features/auth';
import {
  JournalStatsStrip,
  JournalTimeline,
  WishlistList,
  computeJournalStats,
  listMyReviews,
  listWishlist,
} from '@/features/journal';
import { LogTastingDialog } from '@/features/reviews';
import { createClient } from '@/integrations/supabase/server';

export const metadata: Metadata = { title: 'Your journal' };

function Header({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your journal</h1>
      <p className="text-muted-foreground mt-2">
        {children ?? 'Every tasting you log, and the teas you want to try next.'}
      </p>
    </>
  );
}

export default async function JournalPage() {
  // The journal is per user, so it must render per request. Without this the page reads no
  // request data before creating the client, Next may prerender it at build time, and a build
  // without Supabase env vars (CI, Vercel Preview) fails in supabaseEnv().
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
        <Header>Sign in to keep a private log of what you taste and a list of teas to try.</Header>
        <div className="mt-6">
          <SignInButton label="Sign in to start your journal" />
        </div>
      </div>
    );
  }

  const [entries, wishlist] = await Promise.all([
    listMyReviews(supabase, user.id),
    listWishlist(supabase, user.id),
  ]);

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <Header />

      {entries.length === 0 ? (
        <div className="bg-muted flex-center mt-8 flex-col gap-4 rounded-3xl py-16 text-center">
          <p className="text-muted-foreground max-w-sm">
            No tastings yet. Log your first one and it will show up here.
          </p>
          <LogTastingDialog />
        </div>
      ) : (
        <div className="mt-8">
          <JournalStatsStrip stats={computeJournalStats(entries)} />
        </div>
      )}

      <div
        className={
          entries.length > 0 ? 'mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]' : 'mt-10'
        }
      >
        {entries.length > 0 && <JournalTimeline entries={entries} />}
        <section aria-labelledby="want-heading" className="lg:self-start">
          <h2 id="want-heading" className="text-xl font-bold tracking-tight">
            Want to try
          </h2>
          <div className="mt-3">
            <WishlistList products={wishlist} />
          </div>
        </section>
      </div>
    </div>
  );
}
