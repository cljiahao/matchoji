# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router), deployed on Vercel. Supabase for Postgres, Auth (Google OAuth), and Storage (review photos). Confirmed by the user during design (design spec: `docs/superpowers/specs/2026-09-14-matchoji-design.md`).

## Users

Primary: hojicha and matcha drinkers who want to log and rate the specific products they try (brand, grade, origin), and discover new ones others rate highly. No existing app covers both categories together — competitors are single-category (matcha-only, sake-only, coffee-only, wine-only).

Future (Phase 3+, not built yet): farms and roasters who sell hojicha/matcha, once there is a real consumer user base to justify their onboarding.

## Product Purpose

A Vivino-style rating and discovery app for hojicha and matcha specifically — no dedicated hojicha rating app exists today, and matcha-only apps (Matcha Journal, BevMe, Matcha Map, Crumble, Chasen) don't cover hojicha. Long-term, the same product/review data becomes the foundation for a marketplace connecting consumers directly to farms/roasters, and for farm-facing tools that surface demand signals back to growers — but only once real usage justifies building the supply side.

Success for Phase 1 (what's being built now): a working, deployed app where a user can sign in, log/rate a hojicha or matcha product with notes and a photo, and browse a discover feed of what's rating well.

## Positioning

Combines two categories (matcha + hojicha) that every existing "Vivino for X" beverage app treats separately. The specific hook: hojicha is currently trending as an affordable, plentiful counterpart to matcha during the ongoing matcha shortage — surfacing that scarce/abundant contrast side by side is a differentiator no single-category competitor can make.

## Operating Context

A user tries a hojicha or matcha product (at home, a cafe, or bought online), logs it in the app with a star rating, tasting notes, and optionally a photo, and can browse other users' ratings to decide what to try next. No in-person/offline workflow beyond that — it's a personal tasting log with a shared discover feed, not a point-of-sale or in-cafe tool.

## Capabilities and Constraints

Phase 1 (building now): Google OAuth sign-in; add/browse product entries (name, brand, category, grade, region, photo); rate + review a product (stars, notes, photo); discover feed sorted by aggregate rating/recent activity; product detail page.

Explicitly out of scope for Phase 1: no marketplace/checkout, no payments, no vendor accounts/dashboards, no native mobile app, no automated content moderation. These are deferred to later phases per the design spec, built only once Phase 1 has real usage.

Full phased data model and rationale: `docs/superpowers/specs/2026-09-14-matchoji-design.md`.

## Brand Commitments

Name: **Matchoji** (portmanteau of matcha + hojicha), chosen after checking for name collisions with existing apps/trademarks. No logo or other visual assets exist yet — this is greenfield.

## Evidence on Hand

None. No existing users, testimonials, screenshots, or content. This is a pre-launch greenfield build — future work must not fabricate reviews, user counts, or press mentions.

## Product Principles

1. Ship the smallest real thing first: Phase 1 is rating + discovery only, no marketplace, no farm tools, until real usage exists to justify them.
2. Keep the data model seller-agnostic from day one (`Product` exists independent of who sells it), so later phases attach additively without reworking Phase 1 tables.
3. Don't build supply-side infrastructure (marketplace, vendor tools) ahead of the demand side that would use it.
4. Differentiate on category combination (matcha + hojicha together), not on out-competing any single-category incumbent on its own turf.

## Accessibility & Inclusion

No product-specific requirement established yet; follow standard web accessibility practice (semantic HTML, sufficient contrast, keyboard navigation) as a baseline.
