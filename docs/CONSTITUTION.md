# CONSTITUTION.md

## 1. Purpose

This document defines the non-negotiable invariants for **Matchoji**.
It applies to all contributors — human and AI agent alike. When `AGENTS.md`,
templateCentral skills, or any other guidance conflicts with this document,
**this document wins**. No PR may be merged that violates these rules without
an explicit `## Human Approval Override` section in the PR description.

## 2. Architecture Invariants

- `Product` (catalog item) stays seller-agnostic — it must never gain a
  required foreign key to `Vendor` or `Listing`. Vendors/listings attach to
  products, never the reverse; this is what lets Phase 3 (marketplace) and
  Phase 4 (farm tools) bolt on additively without reworking Phase 1 tables.
  See `docs/superpowers/specs/2026-09-14-matchoji-design.md`.
- Feature modules live under `src/features/<name>/` with `api/`,
  `components/`, `hooks/`, `types.ts` — no cross-feature imports except
  through a feature's public `index.ts`.
- Supabase is accessed directly (client + server SDK) for Postgres, Auth,
  and Storage — not through `templatecentral:add (database)`, which only
  wires up Drizzle/Kysely/Mongoose.
- Do not build Phase 3 (marketplace) or Phase 4 (farm-facing tools) features
  without the user explicitly asking to move to that phase — see `PRODUCT.md`
  and the design spec's phase breakdown.

## 3. Security Invariants

- Secrets NEVER appear in code, git, logs, or build output — use environment
  variables loaded from a secrets manager.
- All API routes authenticate before executing business logic.
- All mutations write to an audit log.

## 4. Testing Invariants

- New services must have integration tests (success, error, at least one edge case).
- New API routes must have route tests covering 401, 200, and at least one error path.
- CI must stay green — no PR may be merged with failing tests.

## 5. Git & PR Invariants

- Branch from `main`. Protected branches (`main`, `uat`, `develop`) — no direct commits.
- Every PR to `uat` and `main` requires the PR template fully filled.

## 6. Agent Governance Rules

### Protected files — human approval required

The following files require explicit human approval noted in the PR under
`## Protected File Changes`. Agents MUST NOT modify them without approval.

- `AGENTS.md` / `CLAUDE.md` — agent instruction files
- `docs/CONSTITUTION.md` — this document
- `.claude/settings.json` — harness wiring
- `.claude/hooks/*` — enforcement hooks
- `Dockerfile`
- `.claude/harness.json`, `.claude/verify-harness.sh`, `.claude/regen-harness.sh` — harness integrity baseline/verifier

### Behavioural rules

- Run the quality gate (`pnpm check`) before declaring any task done.
- Never use `--no-verify` on commits — this bypasses pre-commit hooks.
- Work on a feature branch — never commit directly to `main`, `uat`, or `develop`.
