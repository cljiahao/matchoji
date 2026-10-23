# components

## Purpose

The rating UI. `RateThisTea` is Vivino's one-tap rating: signed out, a star opens the
sign-in dialog; signed in, it opens `RateProductForm` in a dialog with that star set.
`LogTastingDialog` (find or add a product, then rate it) also asks for sign-in first; a
tea added there awaits review before it joins Explore, and the dialog says so; a duplicate of
an existing tea is named as such. `CommunityReviews` hides "Add your rating" when the page says
the viewer cannot rate the tea. The
form adds `FlavorNotePicker`, `TasteProfileInput` and the collapsed `PrepFields` (a 16px panel, like the other tiles); star and
taste inputs follow the radiogroup keyboard pattern via `lib/roving-radio`.

The product page shows `ProductInsights` ("What does it taste like?": `TasteStructure`
sliders between two poles, `FlavorFamilies` cards, the typical prep) and
`CommunityReviews` (review cards, the score with `RatingDistribution`, and "Add your
rating"). The review list pages 10 at a time and long notes collapse behind "Read more".
Component tests run the real hooks against a fake browser Supabase client
(`test/support/fake-browser-client.ts`).

## Contents

- `community-reviews.tsx`
- `flavor-families.tsx`
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
- `rate-this-tea.test.tsx`
- `rate-this-tea.tsx`
- `rating-distribution.tsx`
- `review-display.test.tsx`
- `review-item.tsx`
- `review-list.tsx`
- `star-rating-input.test.tsx`
- `star-rating-input.tsx`
- `taste-profile-bars.tsx`
- `taste-profile-input.tsx`
- `taste-structure.tsx`
- `tasting-inputs.test.tsx`

## Parent

[reviews](../README.md)
