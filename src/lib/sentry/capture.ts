import { NEXT_PUBLIC_SENTRY_DSN } from '@/lib/constants/env';

// Client-side reporting for error boundaries. The SDK loads lazily and only with a DSN, so an
// unconfigured deployment never downloads it.
export function captureClientError(error: unknown): void {
  if (!NEXT_PUBLIC_SENTRY_DSN) return;
  void import('@sentry/nextjs').then((Sentry) => Sentry.captureException(error));
}
