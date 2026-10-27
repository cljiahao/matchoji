# components

## Purpose

`ReviewQueueList`: teas awaiting review and shop applications, each with Approve, Reject
(which asks for the reason the submitter will see) and, for teas, "Duplicate of…" plus Merge.
`TeaLinksForm`: pick a catalogue tea, optionally upload its photo, set its shop link. Both
refresh the server page after an action and show the database's refusal as the error.

`TeaPriceForm`: pick a catalogue tea and set its pack price (S$) and pack size (g), or clear both;
validated by `teaPriceSchema` (both above zero, or both empty).

`AdminTabs`: the four admin jobs as tabs, with counts on the two queues. Panels stay mounted so a half-filled form survives a tab switch, and the active tab is kept in the URL hash (`#queue`, `#reports`, `#photo`, `#price`). `TeaSelect`: the catalogue picker the forms share. `TeaLinksForm` shows the picked tea's current photo and credit, and has a Reset button.

`ReportsQueue`: open reports, each with the reported text, a reason box, "Remove" and "Keep it".

`TeaLinksForm` also takes an optional photo credit (at most 120 characters, checked by `teaCreditSchema`) and a "Remove photo" checkbox; with no file and no removal the current photo stays. Picking a tea prefills the credit and shop link from its saved values, so editing one never wipes the other; the form clears after a save.

## Contents

- `admin-tabs.test.tsx`
- `admin-tabs.tsx`
- `index.ts`
- `reports-queue.test.tsx`
- `reports-queue.tsx`
- `review-queue.test.tsx`
- `review-queue.tsx`
- `tea-links-form.tsx`
- `tea-price-form.test.tsx`
- `tea-price-form.tsx`
- `tea-select.tsx`

## Parent

[admin](../README.md)
