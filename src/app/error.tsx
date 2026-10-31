'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { logError } from '@/lib/errors/error-log-handler';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError('app.error-boundary', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      {error.digest && <p className="text-muted-foreground text-sm">Reference: {error.digest}</p>}
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
