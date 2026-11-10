# log-dialog

## Purpose

`LogDialog`, the app-wide way to log a tasting (navbar, mobile tab bar, home, Explore and the journal). A chooser asks "A café drink" or "A tea I brewed" and routes to `DrinkLogFlow` (`cafes`) or `LogTastingFlow` (`reviews`), both loaded with `next/dynamic` on first use. `initial` skips the chooser: `{ kind: 'drink', drink }` goes straight to rating that drink, `{ kind: 'tea', prep }` opens the tea flow with a recipe's brew settings. Logging needs an account, so a signed-out visitor gets the sign-in dialog instead; closing the dialog resets it to the chooser.

It is not re-exported from the widgets `index.ts`: importing it there would pull the `cafes` and `reviews` features into every page that uses `BackLink`. Import it from `@/components/widgets/log-dialog`. `LogTastingDialog` (`reviews`) still serves the recipe button's tea-only path.

## Contents

- `index.ts`
- `log-dialog.test.tsx`
- `log-dialog.tsx`

## Parent

[widgets](../README.md)
