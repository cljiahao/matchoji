# components

## Purpose

`FollowButton` (optimistic, rolls back on refusal, asks visitors to sign in), `BlockButton`,
`TastingFeed` ("Ben rated Sayaka-no-mukashi 5★", with or without the author), and for the
account page `PrivacyToggle` and `BlockedList`. `ReviewReactions` sits under each review on a
tea page: like (instant, rolls back on refusal), comments (the commenter or the review's author
can delete) and report. `NotificationBell` (navbar) shows the unread count and marks them read
when opened. Feed tastings carry the review's edition (harvest year and flush), as every
`Review` does.

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

## Parent

[social](../README.md)
