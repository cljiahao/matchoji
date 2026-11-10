'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { ProductSummary } from '@/features/products';
import { createClient } from '@/integrations/supabase/client';

import { mergeTea, reviewShop, reviewTea } from '../api/admin-service';
import type { PendingShop, PendingTea } from '../types';
import { Decision, dateLabel, useAction } from './moderation-controls';
import { TeaSelect } from './tea-select';

function TeaItem({ tea, catalogue }: { tea: PendingTea; catalogue: ProductSummary[] }) {
  const { busy, run } = useAction();
  const [keep, setKeep] = useState('');
  const supabase = createClient();

  return (
    <li className="space-y-3 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Link href={`/products/${tea.id}`} className="font-semibold break-words hover:underline">
            {tea.name}
          </Link>
          <p className="text-muted-foreground text-sm">
            {[tea.brand, tea.category, tea.grade].filter(Boolean).join(' · ')}
          </p>
        </div>
        <p className="text-muted-foreground text-sm">
          Added {dateLabel(tea.createdAt)}
          {tea.addedByName && ` by ${tea.addedByName}`}
        </p>
      </div>
      <Decision
        label={tea.name}
        busy={busy}
        onDecide={(decision, note) =>
          run(
            () => reviewTea(supabase, tea.id, decision, note),
            decision === 'approved' ? `${tea.name} is in the catalogue.` : `${tea.name} rejected.`
          )
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <TeaSelect
          aria-label={`Tea that ${tea.name} duplicates`}
          className="h-11 min-w-0 flex-1"
          teas={catalogue}
          value={keep}
          onChange={setKeep}
          placeholder="Duplicate of…"
        />
        <Button
          type="button"
          size="lg"
          className="min-h-11"
          variant="outline"
          disabled={busy || !keep}
          onClick={() =>
            run(() => mergeTea(supabase, tea.id, keep), `${tea.name} merged; its tastings moved.`)
          }
        >
          Merge
        </Button>
      </div>
    </li>
  );
}

function ShopItem({ shop }: { shop: PendingShop }) {
  const { busy, run } = useAction();
  const supabase = createClient();
  return (
    <li className="space-y-3 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold break-words">{shop.name}</p>
        <p className="text-muted-foreground text-sm">Applied {dateLabel(shop.createdAt)}</p>
      </div>
      <p className="text-muted-foreground text-sm">
        Ships from {shop.country} to {shop.shipsTo.join(', ')}
        {shop.website && (
          <>
            {' · '}
            <a
              href={shop.website}
              target="_blank"
              rel="noopener noreferrer"
              title={shop.website}
              className="break-all underline"
            >
              {shop.website}
            </a>
          </>
        )}
      </p>
      {shop.profileInfo && <p className="text-sm break-words">{shop.profileInfo}</p>}
      <Decision
        label={shop.name}
        busy={busy}
        onDecide={(decision, note) =>
          run(
            () => reviewShop(supabase, shop.id, decision, note),
            decision === 'approved' ? `${shop.name} can now list teas.` : `${shop.name} rejected.`
          )
        }
      />
    </li>
  );
}

interface ReviewQueueListProps {
  teas: PendingTea[];
  shops: PendingShop[];
  catalogue: ProductSummary[];
}

export function ReviewQueueList({ teas, shops, catalogue }: ReviewQueueListProps) {
  return (
    <div className="space-y-10">
      <section aria-labelledby="queue-teas" className="space-y-3">
        <h2 id="queue-teas" className="text-2xl font-bold tracking-tight">
          Teas awaiting review ({teas.length})
        </h2>
        {teas.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing to review.</p>
        ) : (
          <ul className="divide-y rounded-2xl border">
            {teas.map((tea) => (
              <TeaItem key={tea.id} tea={tea} catalogue={catalogue} />
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="queue-shops" className="space-y-3">
        <h2 id="queue-shops" className="text-2xl font-bold tracking-tight">
          Shop applications ({shops.length})
        </h2>
        {shops.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing to review.</p>
        ) : (
          <ul className="divide-y rounded-2xl border">
            {shops.map((shop) => (
              <ShopItem key={shop.id} shop={shop} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
