export const API_BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';

// The public origin for absolute URLs (sitemap, social previews): the configured base URL,
// else Vercel's production domain, else local dev.
export const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

// Sentry error tracking is inert while the DSN is empty. A DSN only lets a client send events to
// the project, so NEXT_PUBLIC_ exposure is by design. The auth token is build-time only (source
// map upload) and must never be NEXT_PUBLIC_.
export const SENTRY_DSN = process.env.SENTRY_DSN;
export const NEXT_PUBLIC_SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
export const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
