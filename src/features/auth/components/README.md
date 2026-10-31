# components

## Purpose

Sign-in/sign-out UI for the `auth` feature. `auth-components.test.tsx` covers these and
`useSession` in jsdom.

`SignInDialog` is the "Join Matchoji" moment (Continue with Google); `SignInButton` opens
it through the sign-in prompt and takes an `outline` variant and a label. `UserMenu` holds
only account actions. Tests run the real hooks against a fake browser Supabase client.

`UserMenu` links to Your account and Sell on Matchoji above Sign out.

The account menu trigger has a 44px touch target.

## Contents

- `auth-components.test.tsx`
- `auth-status.tsx`
- `index.ts`
- `sign-in-button.tsx`
- `sign-in-dialog.tsx`
- `user-menu.tsx`

## Parent

[auth](../README.md)
