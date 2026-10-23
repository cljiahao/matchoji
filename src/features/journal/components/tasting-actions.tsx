'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RateProductForm, deleteReview } from '@/features/reviews';
import { createClient } from '@/integrations/supabase/client';

import type { JournalEntry } from '../types';

// Edit or delete one of your own tastings from the journal, as Vivino lets you change a rating.
export function TastingActions({ entry }: { entry: JournalEntry }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const name = entry.product.name;

  async function remove() {
    setDeleting(true);
    try {
      await deleteReview(createClient(), entry);
      toast.success('Tasting deleted.');
      setConfirming(false);
      router.refresh();
    } catch {
      toast.error('Could not delete that tasting. Try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setEditing(true)}
        aria-label={`Edit your tasting of ${name}`}
      >
        Edit
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setConfirming(true)}
        aria-label={`Delete your tasting of ${name}`}
      >
        Delete
      </Button>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit your tasting of {name}</DialogTitle>
            <DialogDescription>Change anything; your score updates everywhere.</DialogDescription>
          </DialogHeader>
          <RateProductForm
            product={entry.product}
            review={entry}
            onLogged={() => setEditing(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this tasting?</DialogTitle>
            <DialogDescription>
              Your tasting of {name} and its photo are removed for good.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
            <Button type="button" variant="destructive" disabled={deleting} onClick={remove}>
              Delete tasting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
