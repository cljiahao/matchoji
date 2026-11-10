'use client';

import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth';
import { createClient } from '@/integrations/supabase/client';

import { loadIsTrustedTaster } from '../api/cafes-search';

// Undefined until known, so the rating form never shows the wrong fields for a moment.
export function useIsTrustedTaster(): boolean | undefined {
  const userId = useSession().session?.user.id;
  const { data } = useQuery({
    queryKey: ['is-trusted-taster', userId],
    queryFn: () => loadIsTrustedTaster(createClient(), userId ?? ''),
    enabled: userId !== undefined,
  });
  return data;
}
