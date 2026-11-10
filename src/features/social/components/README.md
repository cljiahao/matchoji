# components

## Purpose

`FollowButton` (optimistic, rolls back on refusal, asks visitors to sign in), `BlockButton`,
`TastingFeed` ("Ben rated Sayaka-no-mukashi 5★", with or without the author), and for the
account page `PrivacyToggle` and `BlockedList` (long names truncate with a title). `ReviewReactions` sits under each review on a
tea page: like (instant, rolls back on refusal; the liked heart uses the `destructive` token so it stays legible in dark), comments (the commenter or the review's author
can delete) and report. `NotificationBell` (navbar) shows the unread count and marks them read
when opened. Feed tastings carry the review's edition (harvest year and flush), as every
`Review` does.

The privacy toggle (both states) and Unblock buttons keep a 44px minimum height. The notification bell has a 44px touch target and its count badge is 12px, the smallest type step.

The notification bell's unread badge uses the 11px type step.

`TastingFeed` renders a drink tasting with its café, disclosure badge and Instagram link.

`TrustedTasterBadge` is the text "Trusted taster" with a decorative icon; `InstagramHandleLink` links `@handle` to the Instagram profile only when the handle passes the handle pattern, else renders nothing.

## Contents

- `block-button.tsx`
- `follow-button.tsx`
- `index.ts`
- `notification-bell.tsx`
- `privacy-and-blocks.tsx`
- `reactions-components.test.tsx`
- `review-reactions.tsx`
- `social-components.test.tsx`
- `tasting-feed.tsx`
- `trusted-taster-badge.test.tsx`
- `trusted-taster-badge.tsx

## Parent

[social](../README.md)
