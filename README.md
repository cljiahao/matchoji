# Matchoji

Interactive controls keep a 44px minimum touch target on phones (padding or an invisible hit area, not a bigger glyph). The header nav links and "Log a tasting" button show from 768px up, with the bottom tab bar below that, and standalone buttons and form fields on the account, admin and journal pages (including the profile privacy and unblock buttons) are at least 44px tall.

Theme colours are held to WCAG AA by `src/app/globals.test.ts`: field edges 3:1, muted and brand text 4.5:1, in light and dark, and the matcha and hojicha category colours as text on white and on grey tiles (and, lifted, on black, tile and muted fills in dark). The footer's Light / Dark / System control makes dark reachable; Light stays the default.

## Sharing and installing

Tea pages, taster profiles and the site itself carry 1200×630 link-preview images (drawn with `next/og` from a bundled Figtree font, no outside service; private profiles share the plain site card), and the site is an installable app: `manifest.ts` plus icons under `/icons`, Apple web-app tags and a light/dark browser-bar colour. Offline support is deliberately small: a hand-written service worker (`public/sw.js`, registered in production only) caches build files and icons and shows an `/offline` page when a page can't load; it never caches pages, API routes or sign-in routes, so browsing still needs a connection. Tea pages also carry a "Goes well with" section of sweets a tea house itself pairs with the tea (`src/features/pairing`, each with a source link; teas with no sourced pairing show none).

## Error tracking (Sentry)

Error tracking is off until you give it a DSN; with none set, nothing is initialised, nothing is sent and the build is unchanged. To turn it on:

1. Create a project at sentry.io (platform: Next.js) and copy its DSN.
2. In Vercel (Project → Settings → Environment Variables) set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to that DSN, then redeploy. A DSN only lets a client send events, so exposing it is fine.
3. Optional, for readable stack traces: set `SENTRY_AUTH_TOKEN` (an org auth token with source-map upload), `SENTRY_ORG` and `SENTRY_PROJECT` for the build. Without the token the upload is skipped and the build still passes.

Browsers post events to the same-origin `/monitoring` tunnel, so the content security policy needs no Sentry host. Reports are scrubbed of emails, cookies, auth headers and Supabase tokens, with no session replay and 10% trace sampling.

## Maps

`/regions` maps the growing regions and `/shops` maps real shop locations, with free OpenStreetMap tiles through Leaflet: no key, no account. Region pins use fixed town-centre coordinates (`src/features/products/lib/region-pins.ts`); there are no farm pins, since makers rarely publish their farms and a farm can be someone's home. Shops live in the `shop_locations` table (migration `20261103000000_shop_locations.sql`, applied by hand in the Supabase SQL editor; until it is, `/shops` shows no shops), managed in the admin Shops tab. Migration `20261104000000_catalogue_expansion.sql` (data only, also applied by hand) adds 31 more real teas from Ippodo, Marukyu Koyamaen, Horii Shichimeien and Kettl, each read on the maker's shop page with its price converted to S$ at the ECB rate of 2026-11-02, and 4 more shops. Every shop needs an address read from its own official site, kept as `source_url`; coordinates are approximate to the building. Tiles follow OSM's tile usage policy (default max zoom, attribution, no prefetching) and the CSP allows `https://tile.openstreetmap.org` for images.

## Structure

The 2026-11-03 impeccable critique (`docs/superpowers/specs/`) tuned empty-state copy and mobile spacing; `DESIGN.md` records the unrated-shelf rule.

### Contents

- `.dockerignore`
- `.env.example`
- `.gitignore`
- `.gitleaks.toml`
- `.impeccable/`
- `.lefthook/`
- `.npmrc`
- `.prettierignore`
- `.prettierrc`
- `AGENTS.md`
- `CHANGELOG.md` (unreleased changes, newest first)
- `CLAUDE.md`
- `components.json`
- `DESIGN.md`
- `docker-entrypoint.sh`
- `Dockerfile`
- `docs/`
- `eslint.config.mjs`
- `FUTURE.md`
- `lefthook.yml`
- `next.config.ts`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `postcss.config.mjs`
- `PRODUCT.md`
- `public/`
- `scripts/`
- `SECURITY.md`
- `src/`
- `supabase/`
- `test/`
- `tsconfig.json`
- `vitest.config.ts`

### Connectivity

`src/` holds all application code (routed through `docs/` for product/design specs and `PRODUCT.md`/`AGENTS.md` for context); `public/` and `scripts/` support the build, `test/` verifies `src/`. `.env.example` lists the runtime env vars (the Sentry ones are documented in the section above; label scanning is optional and ships dark: set `ANTHROPIC_API_KEY`, server-side only, in Vercel's environment variables and the "Scan label" button appears in the Log a tasting dialog; unset, the feature is hidden and `/api/label-scan` answers 503; it also needs the `label_scans` migration applied): the Supabase URL and publishable key are the only required ones, with no mock fallback, so local dev needs `.env.local` (`vitest.config.ts` sets test values for both); `pnpm db:start` runs Supabase locally from `supabase/config.toml` (the `db:*` scripts pin the Supabase CLI version), `pnpm db:check` lists which migrations the linked project has applied, and `pnpm db:types` regenerates database types from it; `pnpm schema:check` (`scripts/schema-check.ts`, set up per `docs/schema-checks.md`) compares the live database with `supabase/migrations/` and `database.types.ts` over a read-only role's connection string, and skips without `SUPABASE_DB_URL`. `next.config.ts` sets the static security headers, and `src/proxy.ts` refreshes sessions and sets the per-request content security policy (scripts only from this site or with that request's nonce, workers only from this site, images only from the site, the Supabase project and Google profile photos, or any https host when the build has no Supabase URL) on every route except `/api/health`, the Sentry tunnel `/monitoring`, the share-preview images, the manifest, `/sw.js`, `/icons` and static files; `next.config.ts` wraps the config with `withSentryConfig` only when a Sentry DSN is set; the nonce makes every page render per request. `package.json` uses caret ranges, so `pnpm update` takes minor and patch releases; majors are upgraded deliberately, one PR each, and `eslint-plugin-sonarjs` is pinned exactly; `pnpm-workspace.yaml` only installs versions at least 3 days old (`minimumReleaseAge`, matching Dependabot's `cooldown`) and also sets security floors for transitive dependencies (`vite` ≥8.3.5 under vitest, and `postcss-selector-parser` 7.x under `@tailwindcss/typography`, which builds byte-identical CSS, and `follow-redirects` ≥1.16.2 under `axios`, `glob` ≥14.0.2 under `@sentry/bundler-plugins`, and `minimatch` ≥11.0.1 everywhere, including under eslint), to lift once the parent ships the fix; `@electric-sql/pglite` (dev only) runs the SQL migrations in tests, under Vitest 5 (which clears mock call history between tests and writes its artifacts to the ignored `.vitest/`). `CHANGELOG.md` records user-facing changes (CI requires an entry whenever `src/` changes). `.gitignore` also excludes `.superpowers/` (local plan-execution scratch), secret and key files, and the Supabase CLI's local `supabase/.temp/` state. `SECURITY.md` says how to report a vulnerability privately. `DESIGN.md` is the visual system `src/` components follow (the Vivino-style "tea shop shelf": white page, product tiles, matcha-green actions, a grouped footer); `.impeccable/design.json` is its machine-readable sidecar. `CHANGELOG.md`, `DESIGN.md` and that sidecar cover the journal and want-to-try list too; `CHANGELOG.md` also covers the discovery features (value score, tea-page highlights, similar teas, top lists), Phase 2's Explore filters, regions page and scarcity sort, Phase 4's tea supply page and community stock reports, Phase 3's vendor listings, the review queue for taster-added teas, the M0 integrity and security fixes, the admin review queue, paged SQL-backed discovery, match scores and taste profiles, tasting edits and account self-service, taster profiles, follows, reactions and notifications, harvest editions and a stash, the database-backed health check, the Learn tab of courses, recipes and guides, tea prices per gram and per cup, tea photo credits and takedown requests, the grouped footer, shared back links and Explore's "Show more", and the batched lookups and widget cleanup after it, and the form and admin-page tidy-up (sections, admin tabs, unit-adorned number fields), and the sign-in callback's redirect origin check. Root-level dotfiles configure the toolchain (lint, format, Docker, git hooks, secret scanning) that every other folder is built and checked against. CI also runs `.github/workflows/uptime.yml`, which pings the live `/api/health` and home page every 15 minutes, `.github/workflows/schema-check.yml` (that check on PRs touching `supabase/**` or the types file, weekly, and on demand; it skips without the `SUPABASE_DB_URL` secret), and `.github/workflows/build.yml`, a production build with the Supabase vars blank (as Vercel Preview builds), and `.github/dependabot.yml` opens weekly grouped dependency PRs (no `@types/node` majors while the runtime is Node 24); the Node floor is 24.22.1 in `engines`, CI and the Dockerfile (digest-pinned), the first 24.x whose bundled roots drop the compromised eMudhra intermediate CAs; Vercel deploys `main` and previews every PR. The repository was recreated on 2026-10-23 to drop pre-rewrite pull-request refs, so PR numbers restart there; earlier history lives in the commits. The agent harness (`.claude/` hooks + `settings.json`, `lefthook.yml`, `.gitleaks.toml`, CI) follows templateCentral 6.1.0, with a few local CI and gitleaks patches listed in `AGENTS.md` § Project-Specific Notes, whose CI also runs a dependency audit (`ci-gates.sh deps`: production dependencies with a high or critical advisory fail the build; the only suppression is an expiring entry in `.claude/dep-audit-allow.txt`) — see `AGENTS.md` § AI Harness.
