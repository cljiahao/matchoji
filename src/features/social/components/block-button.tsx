'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth';
import { createClient } from '@/integrations/supabase/client';

import { setBlocked } from '../api/social-service';

interface BlockButtonProps {
  profileId: string;
  name: string;
  blocked: boolean;
}

// Blocking ends any follow between the two people and stops new ones (the database does both).
export function BlockButton({ profileId, name, blocked }: BlockButtonProps) {
  const { session } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!session) return null;

  async function toggle() {
    if (!session) return;
    setBusy(true);
    try {
      await setBlocked(createClient(), session.user.id, profileId, !blocked);
      toast.success(blocked ? `${name} unblocked.` : `${name} blocked.`);
      router.refresh();
    } catch {
      toast.error('That did not work. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={toggle}>
      {blocked ? `Unblock ${name}` : `Block ${name}`}
    </Button>
  );
}
