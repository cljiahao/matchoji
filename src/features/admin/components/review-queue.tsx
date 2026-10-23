'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ProductSummary } from '@/features/products';
import { createClient } from '@/integrations/supabase/client';

import { mergeTea, reviewShop, reviewTea } from '../api/admin-service';
import type { PendingShop, PendingTea, ReviewDecision } from '../types';

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const selectClass = 'border-input h-9 min-w-0 flex-1 rounded-md border bg-transparent px-3 text-sm';

// Runs one admin action, then re-renders the server page so the item leaves the queue.
function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<void>, done: string) {
    setBusy(true);
    try {
      await action();
      toast.success(done);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'That did not work. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return { busy, run };
}

// Approve in one tap; reject asks for the reason the submitter will see.
function Decision({
  label,
  onDecide,
  busy,
}: {
  label: string;
  onDecide: (decision: ReviewDecision, note?: string) => void;
  busy: boolean;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  if (rejecting) {
    return (
      <div className="w-full space-y-2">
        <Textarea
          aria-label={`Reason for rejecting ${label}`}
          placeholder="Shown to them, e.g. “Duplicate of Sayaka-no-mukashi”"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={busy || !note.trim()}
            onClick={() => onDecide('rejected', note)}
          >
            Reject {label}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" disabled={busy} onClick={() => onDecide('approved')}>
        Approve {label}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => setRejecting(true)}>
        Reject…
      </Button>
    </div>
  );
}

function TeaItem({ tea, catalogue }: { tea: PendingTea; catalogue: ProductSummary[] }) {
  const { busy, run } = useAction();
  const [keep, setKeep] = useState('');
  const supabase = createClient();

  return (
    <li className="space-y-3 px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Link href={`/products/${tea.id}`} className="font-semibold hover:underline">
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
        <select
          aria-label={`Tea that ${tea.name} duplicates`}
          className={selectClass}
          value={keep}
          onChange={(e) => setKeep(e.target.value)}
        >
          <option value="">Duplicate of…</option>
          {catalogue.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand ? `${p.name} · ${p.brand}` : p.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
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
    <li className="space-y-3 px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{shop.name}</p>
        <p className="text-muted-foreground text-sm">Applied {dateLabel(shop.createdAt)}</p>
      </div>
      <p className="text-muted-foreground text-sm">
        Ships from {shop.country} to {shop.shipsTo.join(', ')}
        {shop.website && (
          <>
            {' · '}
            <a href={shop.website} target="_blank" rel="noopener noreferrer" className="underline">
              {shop.website}
            </a>
          </>
        )}
      </p>
      {shop.profileInfo && <p className="text-sm">{shop.profileInfo}</p>}
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
