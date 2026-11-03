import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

import { imageSources } from './src/lib/security/csp';

// Re-exported so the image-source policy stays testable from the config module.
export { imageSources };

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,

  // Names the service worker's cache (see src/features/offline), so each deploy replaces the last.
  env: { NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local' },

  // Uncomment and add domains when using next/image with external URLs:
  // images: {
  //   remotePatterns: [{ protocol: 'https', hostname: 'example.com' }],
  // },

  async headers() {
    // X-Frame-Options is omitted in dev: browsers enforce it even for localhost, which blocks
    // IDE-embedded preview panes (most render via <iframe>). Every deployed environment keeps it.
    // The Content-Security-Policy is set per request in proxy.ts, since it carries a nonce.
    const isDev = process.env.NODE_ENV === 'development';
    return [
      {
        source: '/(.*)',
        headers: [
          ...(isDev ? [] : [{ key: 'X-Frame-Options', value: 'DENY' }]),
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '0' },
          // HSTS — browsers ignore HSTS received over HTTP, so this is only effective over HTTPS.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      {
        // A browser must always re-check the worker script, or a deploy could not replace it.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

// Without a DSN the config is left unwrapped, so an unconfigured build is identical to one
// without Sentry. The auth token only enables source-map upload; without it the upload is
// skipped and a failed upload warns instead of failing the build.
const sentryEnabled = Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      telemetry: false,
      // Same-origin tunnel keeps connect-src free of a Sentry host and dodges ad blockers.
      tunnelRoute: '/monitoring',
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
      errorHandler: (error) => console.warn(`[sentry] build step skipped: ${error.message}`),
    })
  : nextConfig;
