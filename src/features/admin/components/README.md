# components

## Purpose

`ReviewQueueList`: teas awaiting review and shop applications, each with Approve, Reject
(which asks for the reason the submitter will see) and, for teas, "Duplicate of…" plus Merge.
`TeaLinksForm`: pick a catalogue tea, optionally upload its photo, set its shop link. Both
refresh the server page after an action and show the database's refusal as the error.

`TeaPriceForm`: pick a catalogue tea and set its pack price (S$) and pack size (g), or clear both;
validated by `teaPriceSchema` (both above zero, or both empty).

`ReportsQueue`: open reports, each with the reported text, a reason box, "Remove" and "Keep it".

`TeaLinksForm` also takes an optional photo credit (at most 120 characters, checked by `teaCreditSchema`) and a "Remove photo" checkbox; with no file and no removal the current photo stays.

## Contents

- `index.ts`
- `reports-queue.test.tsx`
- `reports-queue.tsx`
- `review-queue.test.tsx`
- `review-queue.tsx`
- `tea-links-form.tsx`
- `tea-price-form.test.tsx`
- `tea-price-form.tsx`

## Parent

[admin](../README.md)
