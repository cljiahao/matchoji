# account

## Purpose

The signed-in person's own account (M2 of the 2026-10-24 roadmap): change the name shown on
their reviews, download everything Matchoji holds about them as JSON, and delete the account.
Deletion removes their photos through the Storage API, then calls `delete_my_account()`,
which keeps their ratings anonymised (as Vivino does), removes the rest and scrubs them from
the audit trail, then signs them out.

## Contents

- `api/`
- `components/`
- `index.ts`

## Connectivity

No feature dependencies; `/account` is its page and the user menu links to it.

## Parent

[features](../README.md)
