# layout

## Purpose

The app shell: navbar, footer, and the theme/query/sign-in-prompt providers every page
renders inside. Navbar and footer share the `max-w-site` column so their edges line up with
page content; the navbar carries the logo, a search pill (off on home and Explore, which have their own),
Explore, Regions, Learn and Journal links (handed to `MobileTabBar`, a fixed bottom bar with Home, Explore,
Log, Learn and Journal, below `sm`, where Regions counts as Explore), the global "Log a
tasting" dialog and `NotificationBell` and `AuthStatus` (sign-in button or user menu). The footer has
the wordmark and tagline, the links the navbar lacks (Tea supply, Sell on Matchoji, plus Regions
on phones, where the tab bar has no Regions tab), and a fine-print row. `Providers` wraps the app in `SessionProvider`,
so every component shares one sign-in session.

The fine print also has "Is one of these photos yours? Ask us to take it down.", a link (new tab) to a prefilled GitHub issue for photo removal requests.

Navbar, footer and tab-bar controls keep a 44px minimum touch target. The tab bar's active badge uses the `brand-foreground` token so it stays legible in dark mode.

## Contents

- `index.ts`
- `mobile-tab-bar.test.tsx`
- `mobile-tab-bar.tsx`
- `navbar.test.tsx`
- `navbar.tsx`
- `providers.tsx`
- `site-footer.test.tsx`
- `site-footer.tsx`
- `theme-provider.tsx`

## Parent

[components](../README.md)
