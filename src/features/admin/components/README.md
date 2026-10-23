# components

## Purpose

`ReviewQueueList`: teas awaiting review and shop applications, each with Approve, Reject
(which asks for the reason the submitter will see) and, for teas, "Duplicate of…" plus Merge.
`TeaLinksForm`: pick a catalogue tea, optionally upload its photo, set its shop link. Both
refresh the server page after an action and show the database's refusal as the error.

`ReportsQueue`: open reports, each with the reported text, a reason box, "Remove" and "Keep it".

## Contents

- `index.ts`
- `reports-queue.test.tsx`
- `reports-queue.tsx`
- `review-queue.test.tsx`
- `review-queue.tsx`
- `tea-links-form.tsx`

## Parent

[admin](../README.md)
