'use client';

import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { createClient } from '@/integrations/supabase/client';

interface UseSessionResult {
  session: Session | null;
  isLoading: boolean;
}

const SessionContext = createContext<UseSessionResult | null>(null);

// One getSession call and one auth subscription, unless `enabled` is false (a provider above
// already holds them).
function useOwnSession(enabled: boolean): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);

  return { session, isLoading };
}

// The app shell holds the session once, so a page of 36 Want-to-try buttons shares one
// subscription instead of opening one each.
export function SessionProvider({ children }: { children: ReactNode }) {
  const value = useOwnSession(true);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// Reads the shared session; outside a SessionProvider (isolated components, tests) it keeps
// its own.
export function useSession(): UseSessionResult {
  const shared = useContext(SessionContext);
  const own = useOwnSession(shared === null);
  return shared ?? own;
}
