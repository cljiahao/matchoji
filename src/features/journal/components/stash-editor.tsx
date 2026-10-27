'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from '@/features/auth';
import { localToday } from '@/features/reviews';
import { createClient } from '@/integrations/supabase/client';

import { setStash, type Stash } from '../api/wishlist-service';

const DAY = 86_400_000;

function stashSummary({ ownedQuantity, openedOn }: Stash, today: string): string | null {
  const parts: string[] = [];
  if (ownedQuantity > 0) parts.push(`${ownedQuantity} in your stash`);
  if (openedOn) {
    const days = Math.round((Date.parse(today) - Date.parse(openedOn)) / DAY);
    const unit = days === 1 ? 'day' : 'days';
    parts.push(days <= 0 ? 'opened today' : `opened ${days} ${unit} ago`);
  }
  return parts.length ? parts.join(' · ') : null;
}

// A light cellar on a want-to-try tea: how many you have and when you opened one. Matcha loses
// freshness once opened, so the age since opening is what is worth seeing.
export function StashEditor({
  productId,
  name,
  stash,
}: {
  productId: string;
  name: string;
  stash: Stash;
}) {
  const { session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(String(stash.ownedQuantity));
  const [openedOn, setOpenedOn] = useState(stash.openedOn ?? '');
  const [busy, setBusy] = useState(false);
  const today = localToday();
  const summary = stashSummary(stash, today);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    const count = Number(quantity);
    if (!Number.isInteger(count) || count < 0 || count > 99) {
      toast.error('Use a whole number from 0 to 99.');
      return;
    }
    setBusy(true);
    try {
      await setStash(createClient(), session.user.id, productId, {
        ownedQuantity: count,
        openedOn: openedOn || null,
      });
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Could not save your stash. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-xs">
      {summary && <p className="text-muted-foreground">{summary}</p>}
      {open ? (
        <form
          onSubmit={save}
          className="bg-muted mt-2 space-y-3 rounded-2xl p-3"
          aria-label={`Stash for ${name}`}
        >
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label htmlFor={`qty-${productId}`}>How many</Label>
              <Input
                id={`qty-${productId}`}
                inputMode="numeric"
                className="bg-background h-10 w-20 tabular-nums"
                aria-describedby={`stash-help-${productId}`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`opened-${productId}`}>Opened on</Label>
              <Input
                id={`opened-${productId}`}
                type="date"
                max={today}
                className="bg-background h-10 w-44"
                value={openedOn}
                onChange={(e) => setOpenedOn(e.target.value)}
              />
            </div>
          </div>
          <p id={`stash-help-${productId}`} className="text-muted-foreground">
            Tins you own, 0 to 99. Leave the date empty if none is open.
          </p>
          <div className="flex gap-2">
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="text-brand inline-flex min-h-10 items-center font-semibold hover:underline"
          onClick={() => setOpen(true)}
        >
          {summary ? 'Edit stash' : 'I have this'}
        </button>
      )}
    </div>
  );
}
