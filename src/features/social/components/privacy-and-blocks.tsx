'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createClient } from '@/integrations/supabase/client';

import { setBlocked, setProfilePublic } from '../api/social-service';

export function PrivacyToggle({ userId, isPublic }: { userId: string; isPublic: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await setProfilePublic(createClient(), userId, !isPublic);
      toast.success(isPublic ? 'Your profile is now private.' : 'Your profile is now public.');
      router.refresh();
    } catch {
      toast.error('Could not change your privacy. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-3 text-sm">
      <p className="max-w-prose">
        {isPublic
          ? 'Your profile is public: anyone can see your recent tastings, taste and followers.'
          : 'Your profile is private: others see only your name. Your ratings still appear on tea pages.'}
      </p>
      <Button type="button" variant="outline" size="lg" disabled={busy} onClick={toggle}>
        {isPublic ? 'Make my profile private' : 'Make my profile public'}
      </Button>
    </div>
  );
}

export function BlockedList({
  userId,
  blocked,
}: {
  userId: string;
  blocked: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function unblock(id: string, name: string) {
    setBusy(id);
    try {
      await setBlocked(createClient(), userId, id, false);
      toast.success(`${name} unblocked.`);
      router.refresh();
    } catch {
      toast.error('Could not unblock. Try again.');
    } finally {
      setBusy(null);
    }
  }

  if (blocked.length === 0) {
    return <p className="text-muted-foreground text-sm">You haven&apos;t blocked anyone.</p>;
  }
  return (
    <ul className="max-w-md divide-y rounded-2xl border">
      {blocked.map((person) => (
        <li key={person.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
          <span className="min-w-0 truncate" title={person.name}>
            {person.name}
          </span>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="shrink-0"
            disabled={busy === person.id}
            onClick={() => unblock(person.id, person.name)}
          >
            Unblock
          </Button>
        </li>
      ))}
    </ul>
  );
}
