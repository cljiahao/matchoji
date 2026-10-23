'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createClient } from '@/integrations/supabase/client';

import { reapplyAsVendor } from '../api/vendor-service';

export function ReapplyButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function reapply() {
    setPending(true);
    try {
      await reapplyAsVendor(createClient());
      toast.success('Application sent again. We will review it soon.');
      router.refresh();
    } catch {
      toast.error('Could not resend your application. Try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" onClick={reapply} disabled={pending}>
      Apply again
    </Button>
  );
}
