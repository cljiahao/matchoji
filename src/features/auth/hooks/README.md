# hooks

## Purpose

Client-side Supabase Auth session tracking: `SessionProvider` (in the app shell) reads the
session once and holds one auth subscription, and `useSession` reads it from there (outside a
provider it keeps its own, as isolated components and tests do; there is no unconfigured
mode), and the sign-in prompt: `SignInPromptProvider`
mounts one `SignInDialog`, and `useSignInPrompt()` opens it from any write a signed-out
visitor starts (rating, logging, want to try), returning them to the page afterwards.

## Contents

- `index.ts`
- `use-session.test.tsx`
- `use-session.tsx`
- `use-sign-in-prompt.tsx`

## Parent

[auth](../README.md)
