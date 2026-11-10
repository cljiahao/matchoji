'use client';

import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth';
import { createClient } from '@/integrations/supabase/client';

import { loadIsTrustedTaster } from '../api/cafes-search';

// `isTaster` is undefined until known, so the rating form never shows the wrong fields for a
// moment. Refetched on every mount: a freshly promoted taster must not sit on a cached false.
export function useIsTrustedTaster() {
  const userId = useSession().session?.user.id;
  const { data, isError, refetch } = useQuery({
    queryKey: ['is-trusted-taster', userId],
    queryFn: () => loadIsTrustedTaster(createClient(), userId ?? ''),
    enabled: userId !== undefined,
    staleTime: 0,
    refetchOnMount: 'always',
    // The dialog's Try again button is the retry; a silent backoff would only delay the message.
    retry: false,
  });
  return { isTaster: data, isError, refetch };
}
