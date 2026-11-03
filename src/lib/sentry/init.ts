import type { init } from '@sentry/nextjs';

import { scrubEvent } from './scrub';

// @sentry/nextjs 11 has no sendDefaultPii option: IP, cookies and user data are not collected by
// default, and scrubEvent strips whatever is left. Shared by the server, edge and browser runtimes. Returns nothing without a DSN so callers
// skip Sentry.init entirely: no SDK work and no network calls.
export function initSentry(dsn: string | undefined, sentryInit: typeof init): boolean {
  if (!dsn) return false;
  sentryInit({
    dsn,
    tracesSampleRate: 0.1,
    beforeSend: scrubEvent,
  });
  return true;
}
