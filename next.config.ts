import type { NextConfig } from 'next';

// Images come only from this site and the project's Supabase Storage (review photos, tea
// photos). Without a Supabase URL at build time (CI's blank-env build) any https host is allowed.
export function imageSources(supabaseUrl: string | undefined): string {
  let storage = 'https:';
  try {
    if (supabaseUrl) storage = new URL(supabaseUrl).origin;
  } catch {
    // An unparsable URL keeps the permissive fallback; the app itself refuses to start without one.
  }
  return `img-src 'self' data: blob: ${storage}`;
}

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,

  // Uncomment and add domains when using next/image with external URLs:
  // images: {
  //   remotePatterns: [{ protocol: 'https', hostname: 'example.com' }],
  // },

  async headers() {
    // Anti-clickjacking headers (X-Frame-Options, CSP frame-ancestors) are omitted in dev —
    // they apply during `next dev` too (including under Turbopack), and browsers enforce them
    // even for localhost, which blocks IDE-embedded preview panes (most render via <iframe>).
    // Full protection still applies in every deployed environment (prod, uat, preview builds).
    const isDev = process.env.NODE_ENV === 'development';
    const imgSrc = imageSources(process.env.NEXT_PUBLIC_SUPABASE_URL);
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
          // CSP baseline — tighten after auth/analytics are wired. frame-ancestors replaces X-Frame-Options for CSP2+ browsers.
          {
            key: 'Content-Security-Policy',
            // script-src stays unset: Next's inline scripts need nonces first.
            value: isDev
              ? `base-uri 'self'; object-src 'none'; form-action 'self'; ${imgSrc}`
              : `frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'; ${imgSrc}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
