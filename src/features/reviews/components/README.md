# components

## Purpose

The rating UI: star input, review list/item, product search-or-create combobox, and the
dialog that combines all of it into one flow. The review list pages 10 at a time with a
"load more" button, and long notes collapse behind "read more". Signed-out visitors adding a product
are sent through Google sign-in first (products need an authenticated insert), and the
dialog reopens with the product filled in. Component tests run the real hooks against a
fake browser Supabase client (`test/support/fake-browser-client.ts`).

The rating form adds `FlavorNotePicker`, `TasteProfileInput` and the collapsed `PrepFields`;
the product page shows `ProductInsights` (`RatingDistribution`, `TasteProfileBars`,
`PrepSummary`).

## Contents

- `flavor-note-picker.tsx`
- `form-selects.tsx`
- `index.ts`
- `log-tasting-dialog.test.tsx`
- `log-tasting-dialog.tsx`
- `prep-fields.tsx`
- `prep-summary.tsx`
- `product-insights.test.tsx`
- `product-insights.tsx`
- `product-search-combobox.test.tsx`
- `product-search-combobox.tsx`
- `rate-product-form.test.tsx`
- `rate-product-form.tsx`
- `rating-distribution.tsx`
- `review-display.test.tsx`
- `review-item.tsx`
- `review-list.tsx`
- `star-rating-input.test.tsx`
- `star-rating-input.tsx`
- `taste-profile-bars.tsx`
- `taste-profile-input.tsx`
- `tasting-inputs.test.tsx`

## Parent

[reviews](../README.md)
