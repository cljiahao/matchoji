# components

## Purpose

The rating UI: star input, review list/item, product search-or-create combobox, and the
dialog that combines all of it into one flow. The review list pages 10 at a time with a
"load more" button, and long notes collapse behind "read more". Component tests run the real hooks against a
fake browser Supabase client (`test/support/fake-browser-client.ts`).

## Contents

- `form-selects.tsx`
- `index.ts`
- `log-tasting-dialog.test.tsx`
- `log-tasting-dialog.tsx`
- `product-search-combobox.test.tsx`
- `product-search-combobox.tsx`
- `rate-product-form.test.tsx`
- `rate-product-form.tsx`
- `review-display.test.tsx`
- `review-item.tsx`
- `review-list.tsx`
- `star-rating-input.test.tsx`
- `star-rating-input.tsx`

## Parent

[reviews](../README.md)
