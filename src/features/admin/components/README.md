# components

## Purpose

`ReviewQueueList`: teas awaiting review and shop applications, each with Approve, Reject
(which asks for the reason the submitter will see) and, for teas, "Duplicate of…" plus Merge.
`TeaLinksForm`: pick a catalogue tea, optionally upload its photo, set its shop link. Both
refresh the server page after an action and show the database's refusal as the error.

`TeaPriceForm`: pick a catalogue tea and set its pack price (S$) and pack size (g), or clear both;
validated by `teaPriceSchema` (both above zero, or both empty); it lists the picked tea's last five recorded prices.

`CafeQueue` and `DrinkQueue`: suggestions awaiting review, each with Approve, Reject (reason required) and "Duplicate of…" plus Merge; `CafeEditForm` and `DrinkEditForm`: pick an approved row and change only what differs (a drink's photo link, credit and tea included). `TastersForm`: search a person by display name, then grant or revoke the badge, above the list of current tasters. `moderation-controls.tsx` holds the shared Approve/Reject control and `useAction`, which shows the database's own error message.

`AdminTabs`: the eight admin jobs as tabs, with counts on the three queues. Panels stay mounted so a half-filled form survives a tab switch, and the active tab is kept in the URL hash (`#queue`, `#reports`, `#photo`, `#price`). `TeaSelect`: the catalogue picker the forms share. `TeaLinksForm` shows the picked tea's current photo and credit, and has a Reset button.

Every admin control (tabs, selects, inputs, buttons, and the whole "Remove photo" row) is at least 44px tall.

`ReportsQueue`: open reports, each with the reported text, a reason box, "Remove" and "Keep it".

`TeaLinksForm` also takes an optional photo credit (at most 120 characters, checked by `teaCreditSchema`) and a "Remove photo" checkbox; with no file and no removal the current photo stays. Picking a tea prefills the credit and shop link from its saved values, so editing one never wipes the other; the form clears after a save.

`shops-form.tsx` is the Shops tab: add, edit and remove `shop_locations` rows, validated with the shops feature's `shopSchema` (latitude ±90, longitude ±180, https source). The table's admin-only RLS is the real gate.

`TastersForm` searches by display name or Instagram handle and asks for confirmation before granting or revoking the trusted-taster badge.

## Contents

- `admin-tabs.test.tsx`
- `admin-tabs.tsx`
- `cafe-edit-form.tsx`
- `cafe-queue.test.tsx`
- `cafe-queue.tsx`
- `drink-edit-form.tsx`
- `drink-queue.test.tsx`
- `drink-queue.tsx`
- `edit-forms.test.tsx`
- `moderation-controls.test.tsx`
- `moderation-controls.tsx`
- `tasters-form.test.tsx`
- `tasters-form.tsx`
- `index.ts`
- `reports-queue.test.tsx`
- `reports-queue.tsx`
- `review-queue.test.tsx`
- `review-queue.tsx`
- `shops-form.test.tsx`
- `shops-form.tsx`
- `tea-links-form.tsx`
- `tea-price-form.test.tsx`
- `tea-price-form.tsx`
- `tea-select.test.tsx`
- `tea-select.tsx`

## Parent

[admin](../README.md)
