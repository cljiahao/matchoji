# docs

## Purpose

Project documentation: the design spec produced by the brainstorming process, and the binding invariants document referenced from `AGENTS.md`.

## Contents

- `CONSTITUTION.md`
- `schema-checks.md`
- `superpowers/`

## Connectivity

`schema-checks.md` is the how-to for `pnpm schema:check`: the read-only database role, its pooler connection string and the `SUPABASE_DB_URL` GitHub secret.

`CONSTITUTION.md` is the project's non-negotiable rules document, enforced by the harness in `.claude/`; its architecture rules include that a product never references a café or drink, and that no marketplace or farm tools get built without the owner's go-ahead. `superpowers/` holds design specs written during feature planning, one per brainstorming session.

## Parent

[matchoji](../README.md)
