# api

## Purpose

`getProfileView` (a taster's name, counts, whether the viewer follows or blocked them, and
their 20 latest tastings unless the profile is private), `loadFeed` (the `following_feed`
function, with names and teas), `setFollowing`, `setBlocked`, `listBlocked` and
`setProfilePublic`. `reactions-service`: `loadReactions` (like counts, the viewer's like and
named comments per review), `setLiked`, `addComment`, `deleteComment`, `reportContent`.
`notifications-service`: `listNotifications` (the latest 20, with actor names), `markAllRead`,
and `describeNotification` / `notificationHref` for each one's copy and link (a `shop_reviewed` notification links to `/sell` only while `MARKETPLACE_ENABLED` is on, else to `/account`). Tested against the
recording fake client.

`loadFeed` and the profile's recent tastings pair each review with its tea or its drink and café. `listNotifications` also selects `drink_id` and `cafe_id` and resolves them to `drinkPath` and `cafePath`; `notificationHref` links a drink like or comment to the drink, and `cafe_reviewed` / `drink_reviewed` notifications to the café or drink, using the notification's own sentence.

`getProfileView` also returns `isTrustedTaster`, `instagramHandle`, `bio` (blank unless the profile is public: the `public_profiles` view does that) and `drinkReviews`. `listTasters` lists trusted, public tasters with their bio, handle, drink review count and latest drink review; it counts only drinks the reader can see and is empty when there are none.

## Contents

- `index.ts`
- `notifications-service.ts`
- `reactions-and-notifications.test.ts`
- `reactions-service.ts`
- `social-service.test.ts`
- `social-service.ts`

## Parent

[social](../README.md)
