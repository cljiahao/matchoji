'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { PAGE_ROUTES } from '@/lib/constants/routes';
import { logError } from '@/lib/errors/error-log-handler';

// Sits inside the public layout, so a failed read (Supabase down, a query error) keeps the
// navbar and tab bar and the visitor can move on instead of landing on a bare page.
export default function PublicError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    logError('public.error-boundary', error);
  }, [error]);

  const digest =
    error instanceof Error && 'digest' in error && typeof error.digest === 'string'
      ? error.digest
      : null;

  return (
    <div className="max-w-site mx-auto flex w-full flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <h1 className="text-2xl font-bold tracking-tight">We couldn’t load this page</h1>
      <p className="text-muted-foreground max-w-sm">
        Something went wrong on our side. Try again, or keep browsing teas.
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href={PAGE_ROUTES.EXPLORE}>Explore teas</Link>
        </Button>
      </div>
      {digest && <p className="text-muted-foreground text-xs">Reference: {digest}</p>}
    </div>
  );
}
