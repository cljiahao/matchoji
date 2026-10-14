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

`src/` holds all application code (routed through `docs/` for product/design specs and `PRODUCT.md`/`AGENTS.md` for context); `public/` and `scripts/` support the build, `test/` verifies `src/`. `.env.example` lists the runtime env vars: the Supabase URL and publishable key are the only required ones (`vitest.config.ts` sets test values for both). `package.json` uses caret ranges, so `pnpm update` takes minor and patch releases; majors are upgraded deliberately, one PR each, and `eslint-plugin-sonarjs` is pinned exactly. Root-level dotfiles configure the toolchain (lint, format, Docker, git hooks, secret scanning) that every other folder is built and checked against. The agent harness (`.claude/` hooks + `settings.json`, `lefthook.yml`, `.gitleaks.toml`, CI) follows templateCentral 6.0.4 — see `AGENTS.md` § AI Harness.
