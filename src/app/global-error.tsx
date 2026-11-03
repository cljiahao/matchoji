'use client';

import { useEffect } from 'react';

import { logError } from '@/lib/errors/error-log-handler';
import { captureClientError } from '@/lib/sentry/capture';

// Replaces the root layout when it throws, so it must render its own <html>/<body> and cannot
// rely on app styles or providers.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError('app.global-error-boundary', error);
    captureClientError(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '0 1.5rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Something went wrong</h1>
          {error.digest && <p>Reference: {error.digest}</p>}
          <button type="button" onClick={reset} style={{ minHeight: 44, padding: '0 1rem' }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
