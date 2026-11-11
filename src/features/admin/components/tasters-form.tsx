'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/integrations/supabase/client';

import { searchProfiles, setTrustedTaster } from '../api/admin-service';
import type { AdminProfile } from '../types';
import { errorMessage } from './moderation-controls';

interface TastersFormProps {
  tasters: AdminProfile[];
}

export function TastersForm({ tasters }: TastersFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<AdminProfile | null>(null);
  const results = useQuery({
    queryKey: ['admin-profile-search', term],
    queryFn: () => searchProfiles(createClient(), term),
    enabled: term.length > 0,
  });

  async function toggle(person: AdminProfile) {
    setBusy(true);
    try {
      await setTrustedTaster(createClient(), person.id, !person.isTrustedTaster);
      toast.success(
        person.isTrustedTaster
          ? `${person.displayName} is no longer a trusted taster.`
          : `${person.displayName} is a trusted taster; their profile is public.`
      );
      await queryClient.invalidateQueries({ queryKey: ['admin-profile-search'] });
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

  function search(event: FormEvent) {
    event.preventDefault();
    setTerm(q.trim());
  }

  const row = (person: AdminProfile) => (
    <li key={person.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <p className="min-w-0 break-words">
        <span className="font-semibold">{person.displayName}</span>
        {person.instagramHandle && (
          <span className="text-muted-foreground"> · @{person.instagramHandle}</span>
        )}
        {!person.isPublic && <span className="text-muted-foreground"> · private profile</span>}
        {person.isTrustedTaster && <span className="text-muted-foreground"> · trusted taster</span>}
      </p>
      <Button
        type="button"
        size="lg"
        className="min-h-11"
        variant={person.isTrustedTaster ? 'outline' : 'default'}
        disabled={busy}
        onClick={() => setConfirming(person)}
      >
        {person.isTrustedTaster ? 'Revoke' : 'Grant'} badge
        <span className="sr-only"> for {person.displayName}</span>
      </Button>
    </li>
  );

  let searchResults: ReactNode;
  if (results.isError) {
    searchResults = (
      <p role="alert" className="text-destructive text-sm">
        {errorMessage(results.error)}
      </p>
    );
  } else if (results.data?.length === 0) {
    searchResults = <p className="text-muted-foreground text-sm">No one by that name or handle.</p>;
  } else {
    searchResults = <ul className="divide-y rounded-2xl border">{results.data?.map(row)}</ul>;
  }

  return (
    <div className="space-y-8">
      <form onSubmit={search} className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Search people by display name or handle"
          className="h-11 min-w-0 flex-1"
          placeholder="Display name or @handle"
          value={q}
          maxLength={80}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" size="lg" className="min-h-11" disabled={!q.trim()}>
          Search
        </Button>
      </form>
      {term && (
        <section aria-label="Search results" className="space-y-2">
          {searchResults}
        </section>
      )}
      <section aria-labelledby="current-tasters" className="space-y-2">
        <h2 id="current-tasters" className="text-2xl font-bold tracking-tight">
          Trusted tasters ({tasters.length})
        </h2>
        {tasters.length === 0 ? (
          <p className="text-muted-foreground text-sm">No one has the badge yet.</p>
        ) : (
          <ul className="divide-y rounded-2xl border">{tasters.map(row)}</ul>
        )}
      </section>
      <AlertDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming?.isTrustedTaster ? 'Revoke trusted taster?' : 'Make a trusted taster?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming?.isTrustedTaster
                ? `${confirming.displayName} loses the badge. Their existing reviews keep their taster label.`
                : `${confirming?.displayName ?? 'This person'} gets the badge, their profile becomes public, and their drink reviews count in the taster score.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={confirming?.isTrustedTaster ? 'destructive' : 'default'}
              disabled={busy}
              onClick={() => confirming && toggle(confirming)}
            >
              {confirming?.isTrustedTaster ? 'Revoke badge' : 'Grant badge'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
