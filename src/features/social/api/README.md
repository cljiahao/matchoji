# api

## Purpose

`getProfileView` (a taster's name, counts, whether the viewer follows or blocked them, and
their 20 latest tastings unless the profile is private), `loadFeed` (the `following_feed`
function, with names and teas), `setFollowing`, `setBlocked`, `listBlocked` and
`setProfilePublic`. `reactions-service`: `loadReactions` (like counts, the viewer's like and
named comments per review), `setLiked`, `addComment`, `deleteComment`, `reportContent`.
`notifications-service`: `listNotifications` (the latest 20, with actor names), `markAllRead`,
and `describeNotification` / `notificationHref` for each one's copy and link. Tested against the
recording fake client.

## Contents

- `index.ts`
- `notifications-service.ts`
- `reactions-and-notifications.test.ts`
- `reactions-service.ts`
- `social-service.test.ts`
- `social-service.ts`

## Parent

[social](../README.md)
