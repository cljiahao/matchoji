# components

## Purpose

Sign-in/sign-out UI for the `auth` feature. `auth-components.test.tsx` covers these and
`useSession` in jsdom.

`SignInDialog` is the "Join Matchoji" moment (Continue with Google); `SignInButton` opens
it through the sign-in prompt and takes an `outline` variant and a label. `UserMenu` holds
only account actions. Tests run the real hooks against a fake browser Supabase client.

`UserMenu` links to Your account, and to Sell on Matchoji only while `MARKETPLACE_ENABLED` is on, above Sign out.

The account menu trigger has a 44px touch target.

`SignInButton` keeps a 44px minimum height on phones.

`AuthStatus` shows a skeleton the size of the Sign in button while the session loads, so the navbar does not shift when it resolves.

## Contents

- `auth-components.test.tsx`
- `auth-status.tsx`
- `index.ts`
- `sign-in-button.tsx`
- `sign-in-dialog.tsx`
- `user-menu.tsx`

## Parent

[auth](../README.md)
