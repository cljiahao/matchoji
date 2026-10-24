# Matchoji

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
- `proxy.ts`
- `public/`
- `scripts/`
- `src/`
- `supabase/`
- `test/`
- `tsconfig.json`
- `vitest.config.ts`

### Connectivity

`src/` holds all application code (routed through `docs/` for product/design specs and `PRODUCT.md`/`AGENTS.md` for context); `public/` and `scripts/` support the build, `test/` verifies `src/`. `.env.example` lists the runtime env vars: the Supabase URL and publishable key are the only required ones, with no mock fallback, so local dev needs `.env.local` (`vitest.config.ts` sets test values for both); `pnpm db:start` runs Supabase locally from `supabase/config.toml`, `pnpm db:check` lists which migrations the linked project has applied, `pnpm db:drift` checks the hosted project has recorded every migration (also the Migration drift workflow, on PRs and daily), and `pnpm db:types` regenerates database types from it. `next.config.ts` sets the security headers (the content security policy allows https images; `script-src` stays relaxed until nonces land), and `proxy.ts` refreshes sessions on every route except `/api/health` and static files. `package.json` uses caret ranges, so `pnpm update` takes minor and patch releases; majors are upgraded deliberately, one PR each, and `eslint-plugin-sonarjs` is pinned exactly; `@electric-sql/pglite` (dev only) runs the SQL migrations in tests. `CHANGELOG.md` records user-facing changes (CI requires an entry whenever `src/` changes). `.gitignore` also excludes `.superpowers/` (local plan-execution scratch). `DESIGN.md` is the visual system `src/` components follow (the Vivino-style "tea shop shelf": white page, product tiles, matcha-green actions, a slim one-row footer); `.impeccable/design.json` is its machine-readable sidecar. `CHANGELOG.md`, `DESIGN.md` and that sidecar cover the journal and want-to-try list too; `CHANGELOG.md` also covers Phase 2's Explore filters, regions page and scarcity sort, Phase 4's tea supply page and community stock reports, Phase 3's vendor listings, the review queue for taster-added teas, the M0 integrity and security fixes, the admin review queue, paged SQL-backed discovery, match scores and taste profiles, tasting edits and account self-service, taster profiles, follows, reactions and notifications, harvest editions and a stash, the database-backed health check, and the batched lookups and widget cleanup after it. Root-level dotfiles configure the toolchain (lint, format, Docker, git hooks, secret scanning) that every other folder is built and checked against. CI also runs `.github/workflows/uptime.yml`, which pings the live `/api/health` and home page every 15 minutes, and `.github/workflows/build.yml`, a production build with the Supabase vars blank (as Vercel Preview builds), and `.github/dependabot.yml` opens weekly grouped dependency PRs (no `@types/node` majors while the runtime is Node 24); Vercel deploys `main` and previews every PR. The repository was recreated on 2026-10-23 to drop pre-rewrite pull-request refs, so PR numbers restart there; earlier history lives in the commits. The agent harness (`.claude/` hooks + `settings.json`, `lefthook.yml`, `.gitleaks.toml`, CI) follows templateCentral 6.0.4 — see `AGENTS.md` § AI Harness.
