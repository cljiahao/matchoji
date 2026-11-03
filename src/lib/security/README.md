# security

## Purpose

Builds the Content-Security-Policy. `buildCsp` returns the header value for one request: a
nonce-based `script-src` (`'self' 'nonce-…' 'strict-dynamic'`, plus `'unsafe-eval'` in dev for
React's debug stacks), `base-uri`, `object-src`, `form-action`, `frame-ancestors` (not in dev, so
IDE preview panes can embed the app) and `imageSources`, which allows images only from the site,
the Supabase project and Google profile photos (any https host when there is no Supabase URL).
`generateNonce` makes the per-request nonce. `src/proxy.ts` calls both. `csp.test.ts` covers the
production and dev variants and that no Sentry host is needed, since browsers report through the same-origin `/monitoring` tunnel.

`worker-src 'self'` lets the offline service worker register: `strict-dynamic` makes `script-src` ignore `'self'`, and workers fall back to it.

Image sources also allow `https://tile.openstreetmap.org`, the map tiles behind `/regions` and `/shops`; there is no `style-src`, so Leaflet's inline positioning needs nothing more, and the nonce + `strict-dynamic` script policy is unchanged.

## Contents

- `csp.test.ts`
- `csp.ts`

## Parent

[lib](../README.md)
