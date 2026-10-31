# Matchoji

Interactive controls keep a 44px minimum touch target on phones (padding or an invisible hit area, not a bigger glyph).

## Structure

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
- `CHANGELOG.md`
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

`src/` holds all application code (routed through `docs/` for product/design specs and `PRODUCT.md`/`AGENTS.md` for context); `public/` and `scripts/` support the build, `test/` verifies `src/`. `.env.example` lists the runtime env vars: the Supabase URL and publishable key are the only required ones, with no mock fallback, so local dev needs `.env.local` (`vitest.config.ts` sets test values for both); `pnpm db:start` runs Supabase locally from `supabase/config.toml` (the `db:*` scripts pin the Supabase CLI version), `pnpm db:check` lists which migrations the linked project has applied, and `pnpm db:types` regenerates database types from it. `next.config.ts` sets the static security headers, and `src/proxy.ts` refreshes sessions and sets the per-request content security policy (scripts only from this site or with that request's nonce, images only from the site, the Supabase project and Google profile photos, or any https host when the build has no Supabase URL) on every route except `/api/health` and static files; the nonce makes every page render per request. `package.json` uses caret ranges, so `pnpm update` takes minor and patch releases; majors are upgraded deliberately, one PR each, and `eslint-plugin-sonarjs` is pinned exactly; `pnpm-workspace.yaml` only installs versions at least 3 days old (`minimumReleaseAge`, matching Dependabot's `cooldown`) and also sets security floors for transitive dependencies (`vite` ≥8.3.5 under vitest, and `postcss-selector-parser` 7.x under `@tailwindcss/typography`, which builds byte-identical CSS, and `follow-redirects` ≥1.16.2 under `axios`), to lift once the parent ships the fix; `@electric-sql/pglite` (dev only) runs the SQL migrations in tests, under Vitest 5 (which clears mock call history between tests and writes its artifacts to the ignored `.vitest/`). `CHANGELOG.md` records user-facing changes (CI requires an entry whenever `src/` changes). `.gitignore` also excludes `.superpowers/` (local plan-execution scratch), secret and key files, and the Supabase CLI's local `supabase/.temp/` state. `SECURITY.md` says how to report a vulnerability privately. `DESIGN.md` is the visual system `src/` components follow (the Vivino-style "tea shop shelf": white page, product tiles, matcha-green actions, a grouped footer); `.impeccable/design.json` is its machine-readable sidecar. `CHANGELOG.md`, `DESIGN.md` and that sidecar cover the journal and want-to-try list too; `CHANGELOG.md` also covers Phase 2's Explore filters, regions page and scarcity sort, Phase 4's tea supply page and community stock reports, Phase 3's vendor listings, the review queue for taster-added teas, the M0 integrity and security fixes, the admin review queue, paged SQL-backed discovery, match scores and taste profiles, tasting edits and account self-service, taster profiles, follows, reactions and notifications, harvest editions and a stash, the database-backed health check, the Learn tab of courses, recipes and guides, tea prices per gram and per cup, tea photo credits and takedown requests, the grouped footer, shared back links and Explore's "Show more", and the batched lookups and widget cleanup after it, and the form and admin-page tidy-up (sections, admin tabs, unit-adorned number fields), and the sign-in callback's redirect origin check. Root-level dotfiles configure the toolchain (lint, format, Docker, git hooks, secret scanning) that every other folder is built and checked against. CI also runs `.github/workflows/uptime.yml`, which pings the live `/api/health` and home page every 15 minutes, and `.github/workflows/build.yml`, a production build with the Supabase vars blank (as Vercel Preview builds), and `.github/dependabot.yml` opens weekly grouped dependency PRs (no `@types/node` majors while the runtime is Node 24); Vercel deploys `main` and previews every PR. The repository was recreated on 2026-10-23 to drop pre-rewrite pull-request refs, so PR numbers restart there; earlier history lives in the commits. The agent harness (`.claude/` hooks + `settings.json`, `lefthook.yml`, `.gitleaks.toml`, CI) follows templateCentral 6.1.0, with a few local CI and gitleaks patches listed in `AGENTS.md` § Project-Specific Notes, whose CI also runs a dependency audit (`ci-gates.sh deps`: production dependencies with a high or critical advisory fail the build; the only suppression is an expiring entry in `.claude/dep-audit-allow.txt`) — see `AGENTS.md` § AI Harness.
