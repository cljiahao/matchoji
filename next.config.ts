import type { NextConfig } from 'next';

import { imageSources } from './src/lib/security/csp';

// Re-exported so the image-source policy stays testable from the config module.
export { imageSources };

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,

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
    ];
  },
};

export default nextConfig;
