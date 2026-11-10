# components

## Purpose

`ScorePair` shows the taster score and the community score side by side (a compact form for lists), hides an empty side, says "Not yet rated" once when neither exists, and adds the gifted/paid disclosure line when it applies. `CafeCard` and `DrinkRow` are link cards for lists. `CitySwitch` (client) links to `?city=` and also remembers the choice in the `matchoji-city` cookie. `CafeFilters` is a plain GET form for area and taster-reviewed only, so filtered lists are shareable URLs.

The logging UI. `DrinkLogFlow` (default export, loaded through `LazyDrinkLogFlow` so no page carries it until the log dialog opens) walks café search, add café, drink search, add drink and rating, and starts at rating when given a drink. `SearchCombobox` is the accessible list autocomplete both searches use; pending items are marked "awaiting review". `AddCafeForm` and `AddDrinkForm` are the add steps. `DrinkReviewForm` rates or edits a drink: stars, notes, date, flavour notes, five optional 1-5 scales (`ScaleInput`; roast for hojicha only), a photo, and for a trusted taster the Instagram post link and `DisclosureRadios` (none checked). `RateThisDrink` is the drink page's button, behind a sign-in gate. `OptionSelect` adapts the select to `CustomFormField`.

## Contents

- `add-cafe-form.tsx`
- `add-drink-form.tsx`
- `cafe-card.tsx`
- `cafe-filters.tsx`
- `city-switch.tsx`
- `disclosure-radios.tsx`
- `drink-log-flow.test.tsx`
- `drink-log-flow.tsx`
- `drink-review-form.test.tsx`
- `drink-review-form.tsx`
- `drink-row.tsx`
- `index.ts`
- `lazy-drink-log-flow.tsx`
- `option-select.tsx`
- `rate-this-drink.test.tsx`
- `rate-this-drink.tsx`
- `scale-input.tsx`
- `score-pair.test.tsx`
- `score-pair.tsx`
- `search-combobox.tsx`

## Parent

[cafes](../README.md)
