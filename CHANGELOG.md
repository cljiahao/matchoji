# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Phase 1 rating and discovery: Google sign-in (Supabase Auth), discover feed with
  matcha/hojicha category tabs, product detail page with reviews, and an inline "Rate it"
  form. The feed's "Log a tasting" dialog searches the catalog or adds a new product.
- Supabase schema migrations: profiles, regions (seeded with the main tea regions),
  products, reviews, the `product_ratings` aggregate view, a review-photo Storage bucket,
  and a `public_profiles` view exposing reviewer display names only.
- Signed-out visitors can fill in a rating; it is kept across Google sign-in and restored
  on return.
- Long review notes collapse behind "Read more"; reviews page 10 at a time.
- Loading skeletons for the feed and product pages.
- `DESIGN.md` and `.impeccable/design.json` recording the Phase 1 design system.
- Component, page and route tests (React Testing Library + jsdom) with a recording fake
  Supabase client; changed-line coverage is above the CI gate's 80%.

### Security

- The OAuth callback only redirects to same-origin paths (open-redirect fix).
- Product search strips PostgREST filter syntax from user input.
- Reviews show a display name, never the reviewer's email.

### Removed

- Scaffold `/dashboard` route and the scaffold footer's placeholder credit and link.
