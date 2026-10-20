# layout

## Purpose

The app shell: navbar, footer, and the theme/query providers every page renders inside.
Navbar and footer share the `max-w-site` column so their edges line up with page content;
the navbar carries Discover/Journal links (moved into the user menu below `sm`), the
global "Log a tasting" dialog and `AuthStatus` (sign-in button or user menu).

## Contents

- `index.ts`
- `navbar.test.tsx`
- `navbar.tsx`
- `providers.tsx`
- `site-footer.tsx`
- `theme-provider.tsx`

## Parent

[components](../README.md)
