'use client';

import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { createClient } from '@/integrations/supabase/client';
import { isSupabaseConfigured } from '@/integrations/supabase/is-configured';

interface UseSessionResult {
  session: Session | null;
  isLoading: boolean;
}

export function useSession(): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, isLoading };
}
