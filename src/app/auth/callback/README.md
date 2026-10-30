# callback

## Purpose

`/auth/callback` — exchanges the Google OAuth code for a Supabase session. Its redirects carry
`Cache-Control: no-store`. Redirects are built from `getAppOrigin`, but a forwarded host is used
only when it matches the host of `SITE_URL`; otherwise the request's own origin is used.

## Contents

- `route.ts`

## Parent

[auth](../README.md)
