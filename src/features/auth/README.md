# auth

## Purpose

Google-OAuth sign-in state via Supabase Auth: session hook and the sign-in/sign-out UI.

## Contents

- `components/`
- `hooks/`
- `index.ts`
- `lib/`

## Connectivity

`hooks/` (`useSession`) tracks the Supabase Auth session client-side; `components/` renders
the right UI for that state (`SignInButton`, `UserMenu`, and `AuthStatus`, which picks
between them). `lib/` holds the Google OAuth call (`signInWithGoogle`, which carries a
return path) and `safeNextPath`, the callback's open-redirect guard.

## Parent

[features](../README.md)
