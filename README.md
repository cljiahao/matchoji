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
- `CLAUDE.md`
- `components.json`
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
- `src/`
- `test/`
- `tsconfig.json`
- `vitest.config.ts`

### Connectivity

`src/` holds all application code (routed through `docs/` for product/design specs and `PRODUCT.md`/`AGENTS.md` for context); `public/` and `scripts/` support the build, `test/` verifies `src/`. Root-level dotfiles configure the toolchain (lint, format, Docker, git hooks, secret scanning) that every other folder is built and checked against.
