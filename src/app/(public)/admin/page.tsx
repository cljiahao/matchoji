import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';

import {
  ReportsQueue,
  ReviewQueueList,
  TeaLinksForm,
  TeaPriceForm,
  isAdmin,
  listApprovedTeas,
  listOpenReports,
  listReviewQueue,
} from '@/features/admin';
import { createClient } from '@/integrations/supabase/server';

// Only admins learn the page exists: everyone else gets "not found", title included.
const canReview = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user !== null && (await isAdmin(supabase));
});

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return {
    title: (await canReview()) ? 'Review queue' : 'Not found',
    robots: { index: false },
  };
}

export default async function AdminPage() {
  await connection();
  if (!(await canReview())) notFound();
  const supabase = await createClient();

  const [queue, catalogue, reports] = await Promise.all([
    listReviewQueue(supabase),
    listApprovedTeas(supabase),
    listOpenReports(supabase),
  ]);

  return (
    <div className="max-w-site mx-auto w-full space-y-12 px-6 py-10 sm:py-14">
      <div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Review queue</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Teas tasters added and shops that applied. A rejection reason is shown to whoever
          submitted it; merging moves a duplicate&apos;s tastings onto the tea it repeats.
        </p>
      </div>
      <ReviewQueueList teas={queue.teas} shops={queue.shops} catalogue={catalogue} />
      <ReportsQueue reports={reports} />
      <section aria-labelledby="tea-links" className="space-y-4">
        <h2 id="tea-links" className="text-2xl font-bold tracking-tight">
          Tea photo and shop link
        </h2>
        <TeaLinksForm catalogue={catalogue} />
      </section>
      <section aria-labelledby="tea-price" className="space-y-4">
        <h2 id="tea-price" className="text-2xl font-bold tracking-tight">
          Tea price
        </h2>
        <TeaPriceForm catalogue={catalogue} />
      </section>
    </div>
  );
}
