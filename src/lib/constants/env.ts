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
