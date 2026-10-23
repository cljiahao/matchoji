'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useSession, useSignInPrompt } from '@/features/auth';
import { createClient } from '@/integrations/supabase/client';

import { setFollowing } from '../api/social-service';

interface FollowButtonProps {
  profileId: string;
  name: string;
  following: boolean;
}

// Follows are a public, two-tap thing on Vivino; signed-out visitors are asked to sign in.
export function FollowButton({ profileId, name, following: initial }: FollowButtonProps) {
  const { session, isLoading } = useSession();
  const promptSignIn = useSignInPrompt();
  const router = useRouter();
  const [following, setState] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!session) {
      promptSignIn({ reason: `Sign in to follow ${name}.` });
      return;
    }
    setBusy(true);
    const next = !following;
    setState(next);
    try {
      await setFollowing(createClient(), session.user.id, profileId, next);
      router.refresh();
    } catch {
      setState(!next);
      toast.error(next ? `Could not follow ${name}.` : `Could not unfollow ${name}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant={following ? 'outline' : 'default'}
      aria-pressed={following}
      disabled={busy || isLoading}
      onClick={toggle}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}
