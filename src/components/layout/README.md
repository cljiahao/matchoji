# layout

## Purpose

The app shell: navbar, footer, and the theme/query/sign-in-prompt providers every page
renders inside. Navbar and footer share the `max-w-site` column so their edges line up with
page content; the navbar carries the logo, a search pill (off on home and Explore, which have their own),
Explore, Regions, Learn and Journal links (handed to `MobileTabBar`, a fixed bottom bar with Home, Explore,
Log, Learn and Journal, below `md`, where Regions counts as Explore), the global "Log a
tasting" dialog and `NotificationBell` and `AuthStatus` (sign-in button or user menu). The footer has
the wordmark and tagline, the links the navbar lacks (Tea supply, Sell on Matchoji, plus Regions
on phones, where the tab bar has no Regions tab), and a fine-print row. `Providers` wraps the app in `SessionProvider`,
so every component shares one sign-in session.

The footer's link column adds "Top lists" (`/top`).

The footer ends with `ThemeToggle`: Light, Dark and System radios over next-themes. Light is the default (`enableSystem` is on, `defaultTheme` stays `light`), so the site only goes dark when a visitor picks it; nothing is checked until after hydration so server and client markup match.

`SiteShell` is the page frame the `(public)` layout and the root not-found page share: a "Skip to content" link (first focusable element, visible on focus), the navbar, `main#main-content`, the footer and the tab bar.

The fine print also has "Is one of these photos yours? Ask us to take it down.", a link (new tab) to a prefilled GitHub issue for photo removal requests.

Navbar, footer and tab-bar controls keep a 44px minimum touch target, including the "Log a tasting" button. The nav links, Log button and tab bar switch at `md` (768px), the wordmark is `shrink-0` so it never runs into the first link, and the search pill waits for `lg` so the row fits at every width. The tab bar's active badge uses the `brand-foreground` token so it stays legible in dark mode.

## Contents

- `index.ts`
- `mobile-tab-bar.test.tsx`
- `mobile-tab-bar.tsx`
- `navbar.test.tsx`
- `navbar.tsx`
- `providers.tsx`
- `site-footer.test.tsx`
- `site-footer.tsx`
- `site-shell.test.tsx`
- `site-shell.tsx`
- `theme-provider.tsx`
- `theme-toggle.test.tsx`
- `theme-toggle.tsx`

## Parent

[components](../README.md)
