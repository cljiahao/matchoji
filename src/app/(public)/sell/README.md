# sell

## Purpose

`/sell`, "Sell on Matchoji", is parked: it returns not-found while `MARKETPLACE_ENABLED` is off (the current setting). With the flag on: signed-out visitors are asked to sign in; a user with no shop
sees the application form; a pending shop sees its status and can edit its details; a rejected shop sees the admin's
reason and can edit its details and apply again; an approved vendor manages listings (their teas, an add form offering only teas not
yet listed, defaulting to their last currency) and shop details. Rendered per request. Its `loading.tsx` skeleton is announced as a busy `status`; the listing form's tea picker is 44px tall on mobile.

## Contents

- `loading.tsx`
- `page.test.tsx`
- `page.tsx`

## Parent

[(public)](../README.md)
