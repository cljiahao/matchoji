import type { captureRequestError } from '@sentry/nextjs';

import { SENTRY_DSN } from '@/lib/constants/env';
import { initSentry } from '@/lib/sentry/init';

export async function register() {
  if (!SENTRY_DSN) return;
  const Sentry = await import('@sentry/nextjs');
  initSentry(SENTRY_DSN, Sentry.init);
}

// Reports errors thrown in route handlers, server components and the proxy.
export async function onRequestError(...args: Parameters<typeof captureRequestError>) {
  if (!SENTRY_DSN) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
}
