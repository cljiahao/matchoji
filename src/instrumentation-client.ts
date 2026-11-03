import { NEXT_PUBLIC_SENTRY_DSN } from '@/lib/constants/env';
import { initSentry } from '@/lib/sentry/init';

if (NEXT_PUBLIC_SENTRY_DSN) {
  void import('@sentry/nextjs').then((Sentry) => initSentry(NEXT_PUBLIC_SENTRY_DSN, Sentry.init));
}
