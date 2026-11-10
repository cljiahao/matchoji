'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type { ReviewDecision } from '../types';

export const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Supabase errors are plain objects with a message, not Error instances; the database's own
// wording (e.g. "approve the café first") is what the admin needs to see.
export function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error;
    if (typeof message === 'string' && message) return message;
  }
  return 'That did not work. Try again.';
}

// Runs one admin action, then re-renders the server page so the item leaves the queue.
export function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<void>, done: string) {
    setBusy(true);
    try {
      await action();
      toast.success(done);
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return { busy, run };
}

// Approve in one tap; reject asks for the reason the submitter will see.
export function Decision({
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="lg"
            variant="destructive"
            className="min-h-11 max-w-full"
            title={label}
            disabled={busy || !note.trim()}
            onClick={() => onDecide('rejected', note)}
          >
            <span className="truncate">Reject {label}</span>
          </Button>
          <Button
            type="button"
            size="lg"
            className="min-h-11"
            variant="outline"
            onClick={() => setRejecting(false)}
          >
            Cancel
          </Button>
          {!note.trim() && <p className="text-muted-foreground text-sm">A reason is needed.</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="lg"
        className="min-h-11 max-w-full"
        title={label}
        disabled={busy}
        onClick={() => onDecide('approved')}
      >
        <span className="truncate">Approve {label}</span>
      </Button>
      <Button
        type="button"
        size="lg"
        className="min-h-11"
        variant="outline"
        onClick={() => setRejecting(true)}
      >
        Reject…
      </Button>
    </div>
  );
}
