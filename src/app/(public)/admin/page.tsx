import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import {
  ReviewQueueList,
  TeaLinksForm,
  isAdmin,
  listApprovedTeas,
  listReviewQueue,
} from '@/features/admin';
import { createClient } from '@/integrations/supabase/server';

export const metadata: Metadata = { title: 'Review queue · Matchoji', robots: { index: false } };

export default async function AdminPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Not a page anyone else should know about: it 404s rather than asking to sign in.
  if (!user || !(await isAdmin(supabase))) notFound();

  const [queue, catalogue] = await Promise.all([
    listReviewQueue(supabase),
    listApprovedTeas(supabase),
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
      <section aria-labelledby="tea-links" className="space-y-4">
        <h2 id="tea-links" className="text-2xl font-bold tracking-tight">
          Tea photo and shop link
        </h2>
        <TeaLinksForm catalogue={catalogue} />
      </section>
    </div>
  );
}
