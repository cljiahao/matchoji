# auth

## Purpose

Google-OAuth sign-in state via Supabase Auth: session hook and the sign-in/sign-out UI.

## Contents

- `components/`
- `hooks/`
- `index.ts`

## Connectivity

`hooks/` (`useSession`) tracks the Supabase Auth session client-side; `components/` renders
the right UI for that state (`SignInButton`, `UserMenu`, and `AuthStatus`, which picks
between them).

## Parent

[features](../README.md)
