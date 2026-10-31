# components

## Purpose

`WhereToBuy`: a tea's offers (vendor, where it ships, price, stock, "Buy from …" opening the
vendor's page in a new tab), or an invitation to sell it. `VendorForm` applies or edits a
shop; `ListingForm` adds a listing (tea picker) or edits one (tea fixed), and names a
duplicate tea in its error; `VendorListings` lists a vendor's teas with in-place edit and
remove; `ReapplyButton` sends a rejected application again. Forms refresh the server-rendered `/sell` page after saving. The listing form's tea picker is 44px tall on mobile.

## Contents

- `index.ts`
- `listing-form.tsx`
- `marketplace-components.test.tsx`
- `reapply-button.tsx`
- `vendor-form.tsx`
- `vendor-listings.tsx`
- `where-to-buy.tsx`

## Parent

[marketplace](../README.md)
