# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router), deployed on Vercel. Supabase for Postgres, Auth (Google OAuth), and Storage (review photos). Confirmed by the user during design (original design spec: `docs/superpowers/specs/2026-09-14-matchoji-design.md`).

## Users

Primary: people in Singapore and Johor Bahru who drink hojicha and matcha at cafés and want to know which café's drink is worth the trip, before they go. They arrive from an Instagram post, a friend's link or a search for a specific café or drink.

Secondary:

- Trusted tasters: the owner and, later, invited reviewers. They carry a visible badge, an Instagram handle and bio, and link the post behind each review.
- Community raters: anyone signed in who rates a drink they had.
- Home brewers: readers who loved a drink and want the tea behind it, its price and how to brew it.

Later, not built (Phase 3+ in the original spec): farms, roasters and vendors who sell tea. They come only once there is a real reader base to justify them.

## Product Purpose

The trusted guide to hojicha and matcha drinks in Singapore and Johor Bahru, rated drink by drink.

Google and Burpple rate a café. Matchoji rates that café's hojicha latte: roast depth, sweetness, tea strength and price per cup. That drink-level local dataset does not exist elsewhere, and it is what Matchoji is for.

Packaged teas stay as the "brew it at home" layer: a drink can name the tea it is made with, and the existing catalogue, Learn content and region data live there.

Success: an Instagram post about a café or drink leads to its Matchoji page, readers rate their own visits, and the data grows past the owner's own reviews.

## Positioning

Drink-level, local and trusted:

- Drink-level: ratings attach to a specific drink at a specific café, not to the café as a whole.
- Local: Singapore and Johor Bahru first. Cities are data, so more can be added later.
- Trusted: taster reviews sit above community ratings. Their score is shown apart from the community score and the two are never blended. Disclosed (invited, gifted or paid) reviews count but are always labelled, and every drink shows how many taster reviews carry a label.

Hojicha and matcha together remain the category, and only hojicha and matcha drinks belong. Matchoji is not a general food or café review site.

## Operating Context

A reader finds a café or drink page (often through an Instagram post), checks the taster and community scores, and decides where to go. After a visit they rate the drink. Trusted tasters link the Instagram post behind each review. There is no ordering, delivery, reservation or opening-hours feature.

## Capabilities and Constraints

Built so far: Google sign-in, a tea catalogue with ratings and reviews, a journal and want-to-try list, taste profiles and match scores, Explore with filters, top lists, regions, Learn content, tea shops, and share previews.

Being built next: cafés and drinks, trusted-taster badges and disclosure, a café map and list with a city switch, top lists by drink style and city, and share cards for café, drink and taster pages.

Parked, not dropped: the marketplace (vendor accounts, listings, "Where to buy", `/sell`). Its tables and code stay in place behind `MARKETPLACE_ENABLED` and its pages are hidden. Commerce stays parked until Matchoji has a business entity and a payment provider.

Inert, not enabled: label scanning and Sentry error tracking ship dark.

Out of scope: checkout and payments, influencer self-signup, automatic Instagram import (posts are linked by URL), cities beyond Singapore and Johor Bahru, a native mobile app.

Empty sections hide. The site never shows "no data" chrome in place of content it does not have.

## Brand Commitments

Name: **Matchoji** (portmanteau of matcha + hojicha), chosen after checking for name collisions with existing apps and trademarks.

## Evidence on Hand

The owner runs an Instagram account of hojicha reviews (foodcnl) covering cafés across Singapore and Johor Bahru. That is the source of the first reviews and of the distribution.

Nothing else is established. There are no published user counts, testimonials or press mentions, and future work must not invent any. Never fabricate cafés, reviews, scores or follower counts: seed only real cafés from real sources and only the owner's real reviews.

## Product Principles

1. Rate the drink, not just the café. Drink-level data is the reason to exist.
2. Trust is visible. Taster reviews are badged and linked to their source, disclosure is always shown, and taster and community scores are never blended.
3. Only hojicha and matcha drinks. Breadth beyond that is a failure even if it works.
4. Never fabricate. No made-up cafés, reviews, scores or counts, and no empty-looking filler in their place.
5. Keep the data model seller-agnostic: a tea (`Product`) never references a café, drink or vendor, so later phases attach additively.
6. Do not build supply-side infrastructure (marketplace, vendor tools) ahead of the readers who would use it.

## Accessibility & Inclusion

No product-specific requirement established yet; follow standard web accessibility practice (semantic HTML, sufficient contrast, keyboard navigation) as a baseline.
