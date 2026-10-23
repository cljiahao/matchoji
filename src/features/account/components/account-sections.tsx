'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/integrations/supabase/client';

import { deleteMyAccount, exportMyData, updateDisplayName } from '../api/account-service';

const MAX_NAME = 40;

export function DisplayNameForm({ userId, current }: { userId: string; current: string }) {
  const router = useRouter();
  const [name, setName] = useState(current);
  const [saving, setSaving] = useState(false);
  const trimmed = name.trim();

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateDisplayName(createClient(), userId, trimmed);
      toast.success('Name saved.');
      router.refresh();
    } catch {
      toast.error('Could not save your name. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-2" aria-label="Display name">
      <Label htmlFor="display-name">Name shown on your reviews</Label>
      <div className="flex gap-2">
        <Input
          id="display-name"
          value={name}
          maxLength={MAX_NAME}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={saving || !trimmed || trimmed === current}>
          Save
        </Button>
      </div>
    </form>
  );
}

export function ExportDataButton({ userId }: { userId: string }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const data = await exportMyData(createClient(), userId);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'matchoji-data.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not prepare your data. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={download} disabled={busy}>
      Download my data
    </Button>
  );
}

const CONFIRM_WORD = 'delete';

// Typing the word first keeps an irreversible action from being one stray tap.
export function DeleteAccountSection({ userId }: { userId: string }) {
  const router = useRouter();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await deleteMyAccount(createClient(), userId);
      toast.success('Your account is deleted.');
      router.replace('/');
      router.refresh();
    } catch {
      toast.error('Could not delete your account. Nothing was removed; try again.');
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md space-y-3">
      <p className="text-sm">
        Your want-to-try list, stock reports, shop and photos are removed. Your ratings stay on the
        teas they rated, with no name attached. This cannot be undone.
      </p>
      <Label htmlFor="confirm-delete">Type “{CONFIRM_WORD}” to confirm</Label>
      <div className="flex gap-2">
        <Input id="confirm-delete" value={typed} onChange={(e) => setTyped(e.target.value)} />
        <Button
          type="button"
          variant="destructive"
          disabled={busy || typed.trim().toLowerCase() !== CONFIRM_WORD}
          onClick={remove}
        >
          Delete my account
        </Button>
      </div>
    </div>
  );
}
