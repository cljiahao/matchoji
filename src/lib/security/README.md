# security

## Purpose

Builds the Content-Security-Policy. `buildCsp` returns the header value for one request: a
nonce-based `script-src` (`'self' 'nonce-…' 'strict-dynamic'`, plus `'unsafe-eval'` in dev for
React's debug stacks), `base-uri`, `object-src`, `form-action`, `frame-ancestors` (not in dev, so
IDE preview panes can embed the app) and `imageSources`, which allows images only from the site,
the Supabase project and Google profile photos (any https host when there is no Supabase URL).
`generateNonce` makes the per-request nonce. `src/proxy.ts` calls both. `csp.test.ts` covers the
production and dev variants.

## Contents

- `csp.test.ts`
- `csp.ts`

## Parent

[lib](../README.md)
