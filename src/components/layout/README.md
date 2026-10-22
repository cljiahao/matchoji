# layout

## Purpose

The app shell: navbar, footer, and the theme/query/sign-in-prompt providers every page
renders inside. Navbar and footer share the `max-w-site` column so their edges line up with
page content; the navbar carries the logo, a search pill (off on home and Explore, which have their own),
Explore, Regions and Journal links (handed to `MobileTabBar`, a fixed bottom bar with Home, Explore,
Log and Journal, below `sm`, where Regions counts as Explore), the global "Log a
tasting" dialog and `AuthStatus` (sign-in button or user menu). The footer is one slim row:
wordmark and tagline, and section links from `sm`.

## Contents

- `index.ts`
- `mobile-tab-bar.test.tsx`
- `mobile-tab-bar.tsx`
- `navbar.test.tsx`
- `navbar.tsx`
- `providers.tsx`
- `site-footer.tsx`
- `theme-provider.tsx`

## Parent

[components](../README.md)
