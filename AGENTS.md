<!-- templateCentral: nextjs@6.0.1 -->

# AGENTS.md — Matchoji

> STOP — Next.js 16 breaking changes: `cookies()`, `headers()`, `params`, `searchParams` are
> ALL async. `middleware.ts` is replaced by `proxy.ts`. Verify before writing route handlers.

## Stack

Next.js 16 · App Router · TypeScript strict · shadcn/ui · TanStack Query v5
React Hook Form · Zod v4 · Vitest · pnpm 11 · Node ≥24
Supabase (Postgres, Auth, Storage) — see `docs/superpowers/specs/2026-09-14-matchoji-design.md`

## Commands

```bash
pnpm dev          # dev server — http://localhost:3000
pnpm build        # production build
pnpm test         # run test suite
pnpm check        # format + lint + typecheck
```

## File Layout

src/app/ — app router (pages, layouts, route handlers)
src/app/api/ — API route handlers
src/features/<name>/ — feature modules: api/, components/, hooks/, types.ts
src/components/ui/ — shadcn primitives (CLI-managed, do not edit directly)
src/components/widgets/ — reusable composed components (project-owned)
proxy.ts + src/lib/auth.ts — auth layer
src/integrations/database/ — database layer (after `templatecentral:add (database)`)
src/lib/constants/env.ts — environment constants

## Skills

### Project skills — check here first

Skills in `.claude/skills/` are scoped to this project. Invoke with `/skill-name`.

| Skill           | What it does                                                      |
| --------------- | ----------------------------------------------------------------- |
| `/next-verify`  | typecheck + lint + test in one pass                               |
| `/next-migrate` | Drizzle push/migrate with safety gate (once database is wired up) |

Add new project skills here whenever you repeat a workflow more than once.

### templateCentral plugin skills — framework-level operations

| Skill                            | When to use                                                  |
| -------------------------------- | ------------------------------------------------------------ |
| `templatecentral:add (auth)`     | JWT/OAuth/session auth                                       |
| `templatecentral:add (database)` | connect Drizzle/Kysely/Mongoose                              |
| `templatecentral:add (feature)`  | full feature: page + API route + hooks (includes components) |
| `templatecentral:add (endpoint)` | API route with auth guard                                    |
| `templatecentral:migrate`        | DB migrations or framework upgrades                          |
| `templatecentral:standards`      | drift check, validation patterns                             |

### impeccable plugin skills — design/UI

| Skill                          | When to use                             |
| ------------------------------ | --------------------------------------- |
| `impeccable shape <surface>`   | Plan UX/UI before writing code          |
| `impeccable polish <target>`   | Final quality pass before shipping      |
| `impeccable critique <target>` | UX design review with heuristic scoring |
| `impeccable audit <target>`    | a11y/perf/responsive technical checks   |

## Rules (always)

- TypeScript strict — no `any`, no `@ts-ignore`
- All user input validated with Zod at every boundary
- DB writes via repository layer only
- `z.input<typeof Schema>` for form types; `z.infer` for post-parse output
- No secrets in `NEXT_PUBLIC_*` variables
- Comments explain _why_, not _what_ — no commented-out code, no change-narration (`// was X, now Y`); own-line over trailing. See `templatecentral:standards (code-standards)`

## AI Harness

PreToolUse (Edit/Write/NotebookEdit): blocks secrets and CI pipeline files only (exit 2): `.env*` (except `.env.example`), CI/CD definitions (`.github/workflows/`, `.github/actions/`, `.azuredevops/`, `azure-pipelines*.y[a]ml`, `.gitlab-ci.yml`, `Jenkinsfile`), cert files (`.pem`/`.key`/`.secret`), `credentials.json`/`.netrc`; a second Bash guard blocks `--no-verify`, hook-layer bypasses (`LEFTHOOK=0`, `git -c core.hooksPath=…`, `git config core.hooksPath`), commits to protected branches, and force-pushes to them (incl. `--force-with-lease`, `HEAD:main`). Skills, specs, and all app code are unrestricted. SessionStart (startup/resume/clear/compact): re-injects AGENTS.md routing context + universal invariants so they survive compaction (PostCompact stdout is also injected as context and fires after compaction, but SessionStart additionally covers resume/startup, so it's the seeded mechanism here).
UserPromptSubmit: pattern-checks incoming prompts for injection phrases; exit 2 blocks the prompt.
PostToolUse: incremental type-check (`pnpm exec tsc --noEmit --incremental`) and a comment-hygiene scan (change-narration comments, oversized comment blocks — patterns from `.claude/comment-hygiene-patterns.txt`) after every Edit/Write. Both feedback-only — findings reach Claude as `additionalContext`, never a block.
Stop hook: runs the full test suite when there are uncommitted changes; exit 2 feeds failures to Claude via stderr; exit 0 on pass (Claude Code caps consecutive Stop continuations — 8 by default). SubagentStop: type-gates a subagent's uncommitted changes (read-only Explore/Plan agents skipped).
Hook wiring: every `settings.json` hook is `"command": "<bin>", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/<script>"]` — an array-valued `command` is silently ignored by Claude Code.
Git hooks (lefthook): pre-commit runs format/lint/typecheck + gitleaks secret-scan on staged files, plus a readme-coupling staleness warning and a comment-hygiene warning; commit-msg enforces Conventional Commits; pre-push runs the quality gate. Hard-local; coverage/changed-line/comment-hygiene gates run in CI.
CI (GitHub Actions): hard gate on changed-line coverage (`diff-cover` ≥80%), lockfile-in-sync (`--frozen-lockfile`), a changelog-touched check, a readme-freshness check, a comment-hygiene check on added lines (bypassable via `skip-comment-check` label), and a gitleaks secret scan (the PR's commits; full history on push to `main`) via the checksum-verified MIT CLI.
Project skills: `.claude/skills/` | Manifest: `.claude/harness.json`
Context load order (context only — not enforcement, broad → specific): managed policy → `~/.claude/CLAUDE.md` → `CLAUDE.md` `@AGENTS.md` (optional, Claude Code) → this file → `.claude/rules/*.md` (lazy per-directory). Hard enforcement: PreToolUse hooks in `settings.json` only.

## Skills Security

- Review `SKILL.md` content before installing any third-party skill — treat skills like packages.
- Scope `allowed-tools:` in skill frontmatter to the minimum needed (e.g. `Bash(git *)` not `Bash`).
- Never install skills that hardcode secrets or make outbound network calls without an explicit allow-list.

## Git Workflow

**Branch source:** Always fork from an up-to-date `main`.
Before branching: `git fetch -p` then update `main` (`git checkout main && git pull --ff-only`). Fork the feature FROM the freshly-pulled `main`.

(The seeded hooks separately protect the common branch names `main`/`uat`/`develop` from direct commits and force-push regardless of which PR route you use — see "AI Harness" above. That protection is a fixed baseline safety net independent of the route table below; it is not "the route" this repo follows, just names the hooks always guard.)

<!-- Per-repo: below this line, document the protected-branch route table for THIS deployment (e.g. develop/uat, develop/staging/live, or trunk). The fetch-first step above is universal; the route clause is not. -->

## Skill capture

- A workflow done twice → author a `.claude/skills/<name>/` project skill and commit it, so the repo (and teammates) carry it, not just session memory. `/skill-audit` surfaces repeats from `.claude/skill-usage.log`.
- Don't vendor third-party plugin skills — re-author the workflow as a project skill tuned to this repo.

## Project-Specific Notes

Supabase is used directly (client + server SDK) for Postgres, Auth, and Storage — not via
`templatecentral:add (database)`, which only wires up Drizzle/Kysely/Mongoose. Supabase
client setup lives under `src/integrations/supabase/` once Phase 1 data layer is built.

Full product context: `PRODUCT.md`. Full phased design spec (all 4 phases, data model,
rationale): `docs/superpowers/specs/2026-09-14-matchoji-design.md`. Phase 1 only is being
built now — do not build Phase 3/4 features (marketplace, vendor tools) without the user
explicitly asking to move to that phase.

## Task Management

For complex tasks (3+ files, architectural decisions): `/superpowers:brainstorm` → `/superpowers:write-plan` → `/superpowers:execute-plan`. Skip for single-file edits or quick fixes.

<!-- [[post-harness]] — reserved for trace capture and meta-harness integration (v5.0+) -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
