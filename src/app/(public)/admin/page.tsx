import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';

import {
  AdminTabs,
  CafeEditForm,
  CafeQueue,
  DrinkEditForm,
  DrinkQueue,
  ReportsQueue,
  ReviewQueueList,
  ShopsForm,
  TastersForm,
  TeaLinksForm,
  TeaPriceForm,
  isAdmin,
  listApprovedCafes,
  listApprovedDrinks,
  listApprovedTeas,
  listCafeQueue,
  listDrinkQueue,
  listOpenReports,
  listReviewQueue,
  listTrustedTasters,
} from '@/features/admin';
import { listShops } from '@/features/shops';
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

  const [
    queue,
    catalogue,
    reports,
    shops,
    cafeQueue,
    approvedCafes,
    drinkQueue,
    approvedDrinks,
    tasters,
  ] = await Promise.all([
    listReviewQueue(supabase),
    listApprovedTeas(supabase),
    listOpenReports(supabase),
    listShops(supabase),
    listCafeQueue(supabase),
    listApprovedCafes(supabase),
    listDrinkQueue(supabase),
    listApprovedDrinks(supabase),
    listTrustedTasters(supabase),
  ]);

  return (
    <div className="max-w-site mx-auto w-full space-y-8 px-6 py-10 sm:py-14">
      <div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Review queue</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Teas, cafés and drinks tasters added, shops that applied, and who is a trusted taster. A
          rejection reason is shown to whoever submitted it; merging moves a duplicate&apos;s
          tastings onto the tea it repeats.
        </p>
      </div>
      <AdminTabs
        queueCount={queue.teas.length + queue.shops.length}
        cafeCount={cafeQueue.length}
        drinkCount={drinkQueue.length}
        reportCount={reports.length}
        queue={<ReviewQueueList teas={queue.teas} shops={queue.shops} catalogue={catalogue} />}
        cafes={
          <div className="space-y-10">
            <CafeQueue cafes={cafeQueue} approved={approvedCafes} />
            <CafeEditForm cafes={approvedCafes} />
          </div>
        }
        drinks={
          <div className="space-y-10">
            <DrinkQueue drinks={drinkQueue} approved={approvedDrinks} />
            <DrinkEditForm drinks={approvedDrinks} teas={catalogue} />
          </div>
        }
        tasters={<TastersForm tasters={tasters} />}
        reports={<ReportsQueue reports={reports} />}
        photo={
          <section aria-labelledby="tea-links" className="space-y-1">
            <h2 id="tea-links" className="text-2xl font-bold tracking-tight">
              Tea photo and shop link
            </h2>
            <p className="text-muted-foreground mb-5 text-sm">
              Set the packshot, who it is credited to, and where to buy the tea.
            </p>
            <TeaLinksForm catalogue={catalogue} />
          </section>
        }
        price={
          <section aria-labelledby="tea-price" className="space-y-1">
            <h2 id="tea-price" className="text-2xl font-bold tracking-tight">
              Tea price
            </h2>
            <p className="text-muted-foreground mb-5 text-sm">
              The reference price behind each tea&apos;s price per gram and band.
            </p>
            <TeaPriceForm catalogue={catalogue} />
          </section>
        }
        shops={
          <section aria-labelledby="shop-locations" className="space-y-1">
            <h2 id="shop-locations" className="text-2xl font-bold tracking-tight">
              Shops
            </h2>
            <p className="text-muted-foreground mb-5 text-sm">
              Real shop locations behind the Where to buy map. Add one only with an address from the
              shop&apos;s own site.
            </p>
            <ShopsForm shops={shops} />
          </section>
        }
      />
    </div>
  );
}
