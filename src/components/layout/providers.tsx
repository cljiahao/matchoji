'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { z } from 'zod';

import { SessionProvider, SignInPromptProvider } from '@/features/auth';

// Zod compiles faster parsers with `new Function`, probing for it first. Under this app's CSP
// (no 'unsafe-eval') the probe is reported as a violation on every page even though Zod falls
// back cleanly, so the browser opts out and never probes. Form schemas are tiny; nothing is lost.
z.config({ jitless: true });

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SignInPromptProvider>{children}</SignInPromptProvider>
      </SessionProvider>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
