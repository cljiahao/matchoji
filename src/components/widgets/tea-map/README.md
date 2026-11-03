# tea-map

## Purpose

`TeaMap`, the one map: Leaflet with OpenStreetMap tiles (`https://tile.openstreetmap.org`, default max zoom, "© OpenStreetMap contributors" attribution, nothing prefetched). Leaflet is dynamically imported inside an effect, so nothing runs on the server; the container is a `role="region"` with the page's `aria-label`, focusable for arrow-key panning, and the scroll wheel does not zoom so the page still scrolls.

Pins (`MapPin`) carry their name as accessible name and title, plus an optional description. A pin with `href` navigates there; one without opens a popup (built from DOM nodes, never HTML strings) with an optional link. Colours come from the matcha, hojicha and brand tokens, zoom and popup controls are 44px, and `.dark` dims the tile layer with a CSS filter. Pages keep a list of the same items beside the map, which is the accessible equivalent.

## Contents

- `index.ts`
- `tea-map.css`
- `tea-map.test.tsx`
- `tea-map.tsx`

## Parent

[widgets](../README.md)
